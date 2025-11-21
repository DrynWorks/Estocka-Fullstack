import api from './api';

export interface Role {
    id: number;
    name: string;
}

export const roleService = {
    async getRoles(): Promise<Role[]> {
        const response = await api.get('/roles');
        return response.data;
    },
};
