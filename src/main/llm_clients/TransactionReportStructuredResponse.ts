import { z } from 'zod';

// Define the transaction schema
const TransactionSchema = z.object({
    id: z.string(),
    asset: z.string(),
    type: z.enum(['Sale', 'Purchase', 'Sale (partial)']),
    date: z.string(), // You might want to use z.date() if you are converting to Date objects
    notification_date: z.string(), // Same as above
    amount: z.string(),
    capital_gains: z.boolean(),
    owner: z.string().optional(), // owner may not be present in all transactions
    details: z.string().optional() // additional details for specific transactions
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Define the certification schema
const CertificationSchema = z.object({
    statement: z.string(),
    filing_id: z.string(),
    signature: z.object({
        name: z.string(),
        date: z.string(), // Again, z.date() could be used if converted to Date objects
    }),
});

// Define the member schema
const MemberSchema = z.object({
    name: z.string(),
    status: z.string(),
    state_district: z.string(),
});

// Define the clerk schema
const ClerkSchema = z.object({
    title: z.string(),
    office: z.string(),
    address: z.string(),
});

// Define the complete report schema
export const PeriodicTransactionReportSchema = z.object({
    clerk: ClerkSchema,
    member: MemberSchema,
    transactions: z.array(TransactionSchema),
    certification: CertificationSchema,
});

export type PeriodicTransactionReport = z.infer<typeof PeriodicTransactionReportSchema>;
