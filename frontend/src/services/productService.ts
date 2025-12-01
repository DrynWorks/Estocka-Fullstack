import api from './api';
import type { Product } from '../types';

export const productService = {
    async getAll(): Promise<Product[]> {
        try {
            const response = await api.get('/products');
            return response.data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    async getById(id: number): Promise<Product> {
        try {
            const response = await api.get(`/products/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching product ${id}:`, error);
            throw error;
        }
    },

    async create(product: Omit<Product, 'id' | 'category'>): Promise<Product> {
        try {
            const response = await api.post('/products', product);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    async update(id: number, product: Partial<Omit<Product, 'id' | 'category'>>): Promise<Product> {
        try {
            const response = await api.put(`/products/${id}`, product);
            return response.data;
        } catch (error) {
            console.error(`Error updating product ${id}:`, error);
            throw error;
        }
    },

    async delete(id: number): Promise<void> {
        try {
            await api.delete(`/products/${id}`);
        } catch (error) {
            console.error(`Error deleting product ${id}:`, error);
            throw error;
        }
    },

    async search(params: {
        name?: string;
        sku?: string;
        category_id?: number;
        low_stock?: boolean;
    }): Promise<Product[]> {
        try {
            const response = await api.get('/products/search', { params });
            return response.data;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    },
};
