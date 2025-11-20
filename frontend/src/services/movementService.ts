import api from './api';
import type { Movement } from '../types';

export interface MovementCreate {
    product_id: number;
    type: 'entrada' | 'saida';
    quantity: number;
    reason?: string;
    note?: string;
}

export const movementService = {
    async getAll(): Promise<Movement[]> {
        const response = await api.get('/movements');
        return response.data;
    },

    async getRecent(limit: number = 50): Promise<Movement[]> {
        const response = await api.get(`/movements/recent?limit=${limit}`);
        return response.data;
    },

    async create(movement: MovementCreate): Promise<Movement> {
        const response = await api.post('/movements', movement);
        return response.data;
    },

    async revert(id: number): Promise<Movement> {
        const response = await api.post(`/movements/${id}/revert`);
        return response.data;
    },
};
