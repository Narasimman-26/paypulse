import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const createInvoiceSchema = z.object({
  title: z.string().trim().min(1, "Invoice title is required").max(200, "Title too long"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.enum(["USD", "INR", "EUR"], {
    message: "Currency must be USD, INR, or EUR",
  }),
  dueDate: z.string().min(1, "Due date is required"),
  clientId: z.string().min(1, "Please select a client"),
  notes: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  id: z.string().min(1, "Invoice ID is required"),
  status: z.enum(["DRAFT", "SENT", "PAID"], {
    message: "Manual status update allows DRAFT, SENT, or PAID only",
  }),
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
