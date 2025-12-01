import api from './api';

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: {
        id: number;
        name: string;
    };
}

export interface UserCreate {
    email: string;
    password: string;
    full_name: string;
    role_id: number;
}

export interface UserUpdate {
    email?: string;
    password?: string;
    full_name?: string;
    role_id?: number;
}

export const userService = {
    async getUsers(): Promise<User[]> {
        try {
            const response = await api.get('/users');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    async getUserById(id: number): Promise<User> {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching user ${id}:`, error);
            throw error;
        }
    },

    async createUser(user: UserCreate): Promise<User> {
        try {
            const response = await api.post('/users', user);
            return response.data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    async updateUser(id: number, user: UserUpdate): Promise<User> {
        try {
            const response = await api.patch(`/users/${id}`, user);
            return response.data;
        } catch (error) {
            console.error(`Error updating user ${id}:`, error);
            throw error;
        }
    },

    async deleteUser(id: number): Promise<void> {
        try {
            await api.delete(`/users/${id}`);
        } catch (error) {
            console.error(`Error deleting user ${id}:`, error);
            throw error;
        }
    },
};
