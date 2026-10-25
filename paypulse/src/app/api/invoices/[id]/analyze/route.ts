import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoiceRiskAnalysis } from "@/lib/data-store";
import { computeSignals } from "@/lib/risk";
import { analyzeInvoiceRiskWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";

/**
 * POST /api/invoices/[id]/analyze
 * Runs AI invoice risk analysis using Gemini (server-side only)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const invoice = getInvoice(id);
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Only for invoices not PAID/CANCELLED
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      return NextResponse.json(
        {
          error: `Cannot analyze invoice in '${invoice.status}' status. Risk analysis is only available for active, unpaid invoices.`,
        },
        { status: 400 }
      );
    }

    // Parse force flag from JSON body or URL query parameter
    let force = req.nextUrl.searchParams.get("force") === "true";
    try {
      const body = await req.json();
      if (body?.force === true) {
        force = true;
      }
    } catch {
      // Body may be empty if called via simple POST
    }

    // Skip re-analysis within 5 minutes unless forced
    if (invoice.riskAnalyzedAt && !force) {
      const lastAnalyzedTime = new Date(invoice.riskAnalyzedAt).getTime();
      const elapsedMs = Date.now() - lastAnalyzedTime;
      const fiveMinutesMs = 5 * 60 * 1000;

      if (elapsedMs < fiveMinutesMs) {
        const remainingSec = Math.ceil((fiveMinutesMs - elapsedMs) / 1000);
        return NextResponse.json(
          {
            success: true,
            cached: true,
            message: `Invoice was analyzed recently. Next refresh available in ${remainingSec}s (or use force=true).`,
            invoice,
            analysis: {
              riskScore: invoice.riskScore,
              riskLevel: invoice.riskLevel,
              reason: invoice.riskReason,
              recommendedAction: invoice.recommendedAction,
              reminderTone: invoice.reminderTone,
              dataLimited: invoice.riskDataLimited,
              riskAnalyzedAt: invoice.riskAnalyzedAt,
            },
          },
          { status: 200 }
        );
      }
    }

    // 1. Compute deterministic signals (no client email sent)
    const signals = computeSignals(invoice);

    // 2. Analyze with Gemini (structured output, low temperature, baseline fallback)
    const analysis = await analyzeInvoiceRiskWithGemini(signals, invoice.title);

    // 3. Persist the result + riskAnalyzedAt + riskDataLimited
    const analyzedAt = new Date().toISOString();
    const updatedInvoice = updateInvoiceRiskAnalysis(invoice.id, {
      riskScore: analysis.riskScore,
      riskReason: analysis.reason,
      riskLevel: analysis.riskLevel,
      recommendedAction: analysis.recommendedAction,
      reminderTone: analysis.reminderTone,
      riskDataLimited: analysis.dataLimited,
      riskAnalyzedAt: analyzedAt,
    });

    return NextResponse.json(
      {
        success: true,
        cached: false,
        message: analysis.isFallback
          ? "Generated rule-based risk estimate (Gemini API unavailable or fallback used)."
          : "Invoice risk analyzed successfully with Gemini AI.",
        invoice: updatedInvoice || invoice,
        analysis: {
          ...analysis,
          riskAnalyzedAt: analyzedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal error";
    console.error("[Invoice Risk Analyze Error]:", error);
    return NextResponse.json(
      { error: "Failed to analyze invoice risk", detail: errorMsg },
      { status: 500 }
    );
  }
}
