import { z } from 'zod';

export const movementSchema = z.object({
    product_id: z.string()
        .min(1, 'Produto é obrigatório'),

    type: z.enum(['IN', 'OUT']),

    quantity: z.string()
        .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
            message: 'Quantidade deve ser maior que 0'
        }),

    reason: z.string()
        .max(500, 'Motivo deve ter no máximo 500 caracteres')
        .optional()
        .or(z.literal('')),

    reference: z.string()
        .max(100, 'Referência deve ter no máximo 100 caracteres')
        .optional()
        .or(z.literal('')),
});

export type MovementFormData = z.infer<typeof movementSchema>;
