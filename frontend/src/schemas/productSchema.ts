import { z } from 'zod';

export const productSchema = z.object({
    name: z.string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres'),

    sku: z.string()
        .min(3, 'SKU deve ter no mínimo 3 caracteres')
        .max(50, 'SKU deve ter no máximo 50 caracteres'),

    category_id: z.string()
        .min(1, 'Categoria é obrigatória'),

    price: z.string()
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: 'Preço deve ser maior que 0'
        }),

    cost_price: z.string()
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: 'Preço de custo deve ser maior que 0'
        }),

    quantity: z.string()
        .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
            message: 'Quantidade deve ser maior ou igual a 0'
        }),

    alert_level: z.string()
        .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
            message: 'Nível de alerta deve ser maior ou igual a 0'
        }),

    lead_time: z.string()
        .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
            message: 'Prazo de entrega deve ser maior ou igual a 0'
        }),
});

export type ProductFormData = z.infer<typeof productSchema>;
