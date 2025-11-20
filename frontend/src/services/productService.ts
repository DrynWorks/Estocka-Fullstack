import api from './api';
import type { Product } from '../types';

export const productService = {
    async getAll(): Promise<Product[]> {
        const response = await api.get('/products');
        return response.data;
    },

    async getById(id: number): Promise<Product> {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    async create(product: Omit<Product, 'id' | 'category'>): Promise<Product> {
        const response = await api.post('/products', product);
        return response.data;
    },

    async update(id: number, product: Partial<Omit<Product, 'id' | 'category'>>): Promise<Product> {
        const response = await api.put(`/products/${id}`, product);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/products/${id}`);
    },

    async search(params: {
        name?: string;
        sku?: string;
        category_id?: number;
        low_stock?: boolean;
    }): Promise<Product[]> {
        const response = await api.get('/products/search', { params });
        return response.data;
    },
};
