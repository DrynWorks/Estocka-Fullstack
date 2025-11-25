import api from './api';
import type { AuditLog } from '@/types';

interface AuditFilters {
    user_id?: number;
    action?: 'create' | 'update' | 'delete';
    entity_type?: 'product' | 'movement' | 'category' | 'user';
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
}

export const auditService = {
    async getLogs(filters?: AuditFilters): Promise<AuditLog[]> {
        const params = new URLSearchParams();

        if (filters?.user_id) params.append('user_id', filters.user_id.toString());
        if (filters?.action) params.append('action', filters.action);
        if (filters?.entity_type) params.append('entity_type', filters.entity_type);
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const queryString = params.toString();
        const url = queryString ? `/audit/logs?${queryString}` : '/audit/logs';

        const response = await api.get<AuditLog[]>(url);
        return response.data;
    },
};
