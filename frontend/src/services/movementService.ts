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
        try {
            const response = await api.get('/movements');
            return response.data;
        } catch (error) {
            console.error('Error fetching movements:', error);
            throw error;
        }
    },

    async getRecent(limit: number = 50): Promise<Movement[]> {
        try {
            const response = await api.get(`/movements/recent?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching recent movements:', error);
            throw error;
        }
    },

    async create(movement: MovementCreate): Promise<Movement> {
        try {
            const response = await api.post('/movements', movement);
            return response.data;
        } catch (error) {
            console.error('Error creating movement:', error);
            throw error;
        }
    },

    async revert(id: number): Promise<Movement> {
        try {
            const response = await api.post(`/movements/${id}/revert`);
            return response.data;
        } catch (error) {
            console.error(`Error reverting movement ${id}:`, error);
            throw error;
        }
    },
};
