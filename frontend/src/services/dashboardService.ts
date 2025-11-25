/**
 * Dashboard API service for analytics and KPIs.
 */

import api from './api';

export interface InventoryMetrics {
    total_value: number;
    total_items: number;
    total_quantity: number;
}

export interface ProfitabilityMetrics {
    average_margin_percent: number;
    total_potential_profit: number;
}

export interface StockHealthMetrics {
    rupture_rate_percent: number;
    products_out_of_stock: number;
    total_products: number;
}

export interface DashboardOverview {
    inventory: InventoryMetrics;
    profitability: ProfitabilityMetrics;
    stock_health: StockHealthMetrics;
}

export interface SalesTrendData {
    labels: string[];
    data: number[];
    total_movements: number;
}

export interface TopProductsData {
    labels: string[];
    data: number[];
}

export interface ABCDistributionData {
    A: number;
    B: number;
    C: number;
}

class DashboardService {
    /**
     * Get dashboard overview with all main KPIs.
     */
    async getOverview(): Promise<DashboardOverview> {
        const response = await api.get<DashboardOverview>('/dashboard/overview');
        return response.data;
    }

    /**
     * Get sales trend data for chart.
     * 
     * @param days - Number of days to look back (7-365)
     */
    async getSalesTrend(days: number = 30): Promise<SalesTrendData> {
        const response = await api.get<SalesTrendData>('/dashboard/sales-trend', {
            params: { days }
        });
        return response.data;
    }

    /**
     * Get top N products.
     * 
     * @param limit - Number of products (1-20)
     * @param metric - "movements" or "value"
     */
    async getTopProducts(limit: number = 5, metric: 'movements' | 'value' = 'movements'): Promise<TopProductsData> {
        const response = await api.get<TopProductsData>('/dashboard/top-products', {
            params: { limit, metric }
        });
        return response.data;
    }

    /**
     * Get ABC distribution data for pie/donut chart.
     */
    async getABCDistribution(): Promise<ABCDistributionData> {
        const response = await api.get<ABCDistributionData>('/dashboard/abc-distribution');
        return response.data;
    }
}

export default new DashboardService();
