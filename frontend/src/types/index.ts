export interface User {
    id: number;
    email: string;
    full_name: string;
    role: {
        id: number;
        name: string;
    };
    organization_id: number;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    cost_price: number;
    quantity: number;
    alert_level: number;
    lead_time: number;
    category: {
        id: number;
        name: string;
        description?: string;
        organization_id: number;
    };
    organization_id: number;
}

export interface Movement {
    id: number;
    product_id: number;
    type: 'entrada' | 'saida';
    quantity: number;
    reason?: string;
    note?: string;
    created_at: string;
    product: Product;
    created_by?: User;
    organization_id: number;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    organization_id: number;
}

export interface AuditLog {
    id: number;
    user_id: number | null;
    action: 'create' | 'update' | 'delete';
    entity_type: 'product' | 'movement' | 'category' | 'user';
    entity_id: number | null;
    details: Record<string, any> | null;
    created_at: string;
    organization_id: number;
}
