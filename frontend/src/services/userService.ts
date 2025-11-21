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
        const response = await api.get('/users');
        return response.data;
    },

    async getUserById(id: number): Promise<User> {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    async createUser(user: UserCreate): Promise<User> {
        const response = await api.post('/users', user);
        return response.data;
    },

    async updateUser(id: number, user: UserUpdate): Promise<User> {
        const response = await api.patch(`/users/${id}`, user);
        return response.data;
    },

    async deleteUser(id: number): Promise<void> {
        await api.delete(`/users/${id}`);
    },
};
