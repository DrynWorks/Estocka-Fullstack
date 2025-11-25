/**
 * Organization API service for managing organization data.
 */

import api from './api';

export interface Organization {
    id: number;
    name: string;
    slug: string;
    cnpj?: string;
    active: boolean;
    created_at: string;
}

export interface OrganizationCreate {
    name: string;
    slug: string;
    cnpj?: string;
}

export interface OrganizationUpdate {
    name?: string;
    cnpj?: string;
    active?: boolean;
}

class OrganizationService {
    /**
     * Get current user's organization.
     */
    async getMyOrganization(): Promise<Organization> {
        const response = await api.get<Organization>('/organizations/me');
        return response.data;
    }

    /**
     * Update current user's organization.
     * Only admin/owner can update.
     */
    async updateMyOrganization(data: OrganizationUpdate): Promise<Organization> {
        const response = await api.patch<Organization>('/organizations/me', data);
        return response.data;
    }

    /**
     * Create a new organization.
     * Use this during initial setup or registration.
     */
    async create(data: OrganizationCreate): Promise<Organization> {
        const response = await api.post<Organization>('/organizations/', data);
        return response.data;
    }
}

export default new OrganizationService();
