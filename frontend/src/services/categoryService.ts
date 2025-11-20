import api from './api';
import type { Category } from '../types';

export const categoryService = {
    async getAll(): Promise<Category[]> {
        const response = await api.get('/categories');
        return response.data;
    },

    async create(category: Omit<Category, 'id'>): Promise<Category> {
        const response = await api.post('/categories', category);
        return response.data;
    },
};
