import { z } from 'zod'

const withdrawSchema = z.object({
    amount: z
        .number({ error: 'amount is required' })
        .positive('amount must be greater than zero')
        .max(1_000_000, 'amount exceeds maximum allowed'),
    wallet_number: z
        .string({ error: 'wallet_number is required' })
        .min(5, 'wallet_number must be at least 5 characters')
        .max(50, 'wallet_number must be at most 50 characters'),
})

const adminWithdrawStatusSchema = z.object({
    status: z.enum(['Approved', 'Rejected'], {
        message: 'status must be Approved or Rejected',
    }),
})

export { withdrawSchema, adminWithdrawStatusSchema }
