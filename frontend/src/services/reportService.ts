import api from './api';

export interface StockOverview {
    total_products: number;
    total_stock_value: number;
    low_stock_products: any[];
    out_of_stock_products: any[];
}

export interface ABCItem {
    product_id: number;
    product_name: string;
    value: number;
    percentage: number;
    cumulative_percentage: number;
    classification: 'A' | 'B' | 'C';
}

export interface XYZItem {
    product_id: number;
    product_name: string;
    cv: number;
    classification: 'X' | 'Y' | 'Z';
}

export interface TurnoverItem {
    product_id: number;
    product_name: string;
    turnover_rate: number;
    avg_inventory: number;
    total_sales: number;
}

export interface FinancialReport {
    total_inventory_value: number;
    total_cost_value: number;
    potential_profit: number;
    average_margin: number;
}

export interface ForecastItem {
    product_id: number;
    product_name: string;
    daily_usage: number;
    days_until_stockout: number;
    reorder_point: number;
    status: 'OK' | 'WARNING' | 'CRITICAL';
}

export const reportService = {
    async getOverview(): Promise<StockOverview> {
        const response = await api.get('/reports/overview');
        return response.data;
    },

    async getABC(): Promise<{ items: ABCItem[] }> {
        const response = await api.get('/reports/abc');
        return response.data;
    },

    async getXYZ(): Promise<{ items: XYZItem[] }> {
        const response = await api.get('/reports/xyz');
        return response.data;
    },

    async getTurnover(): Promise<{ items: TurnoverItem[] }> {
        const response = await api.get('/reports/turnover');
        return response.data;
    },

    async getFinancial(): Promise<FinancialReport> {
        const response = await api.get('/reports/financial');
        return response.data;
    },

    async getForecast(): Promise<{ items: ForecastItem[] }> {
        const response = await api.get('/reports/forecast');
        return response.data;
    },
};
