import api from './api';
import type { Category } from '../types';

export const categoryService = {
    async getAll(): Promise<Category[]> {
        try {
            const response = await api.get('/categories');
            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    async create(category: Omit<Category, 'id'>): Promise<Category> {
        try {
            const response = await api.post('/categories', category);
            return response.data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },
};
