"use server";

import { revalidatePath } from "next/cache";
import { addClient, getClients, ClientItem } from "@/lib/data-store";
import { createClientSchema } from "@/lib/validations";

export interface ClientActionResult {
  success: boolean;
  client?: ClientItem;
  errors?: {
    name?: string[];
    email?: string[];
    general?: string;
  };
  message?: string;
}

export async function createClientAction(
  data: { name: string; email: string }
): Promise<ClientActionResult> {
  const result = createClientSchema.safeParse(data);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      success: false,
      errors: {
        name: fieldErrors.name,
        email: fieldErrors.email,
      },
    };
  }

  const { name, email } = result.data;

  // Duplicate email check
  const existingClients = getClients();
  const duplicate = existingClients.find(
    (c) => c.email.toLowerCase() === email.toLowerCase()
  );

  if (duplicate) {
    return {
      success: false,
      errors: {
        email: ["A client with this email already exists"],
      },
    };
  }

  try {
    const newClient = addClient({
      name,
      email,
    });

    revalidatePath("/clients");
    revalidatePath("/invoices/new");

    return {
      success: true,
      client: newClient,
      message: `Client "${newClient.name}" created successfully.`,
    };
  } catch {
    return {
      success: false,
      errors: {
        general: "Failed to create client. Please try again.",
      },
    };
  }
}
