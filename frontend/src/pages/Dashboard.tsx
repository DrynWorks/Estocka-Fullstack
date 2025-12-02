import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reportService, type StockOverview } from '@/services/reportService';
import { movementService } from '@/services/movementService';
import type { Movement } from '@/types';
import { Package, TrendingDown, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { ABCDistributionChart } from '@/components/dashboard/ABCDistributionChart';
import { formatCurrency, formatDateTime, formatNumber } from '@/utils/formatters';

import { usePermissions } from '@/hooks/usePermissions';

export default function Dashboard() {
    const { canView } = usePermissions();
    const [overview, setOverview] = useState<StockOverview | null>(null);
    const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const promises: Promise<any>[] = [];
            // Always try to load overview, backend should handle data filtering
            promises.push(reportService.getOverview());

            // Only load movements if user has permission
            if (canView('movements')) {
                promises.push(movementService.getRecent(10));
            } else {
                promises.push(Promise.resolve([]));
            }

            const results = await Promise.all(promises);
            const overviewData = results[0] as StockOverview;
            const movements = results[1] as Movement[];

            setOverview(overviewData);
            setRecentMovements(movements);
        } catch (error) {
            console.error('[Dashboard] Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-slate-600 animate-pulse">Carregando dashboard...</div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Total de Produtos',
            value: overview?.total_products || 0,
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            link: '/products',
            resource: 'products'
        },
        {
            title: 'Valor em Estoque',
            value: formatCurrency(overview?.total_stock_value || 0),
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            link: '/reports',
            resource: 'reports'
        },
        {
            title: 'Produtos em Falta',
            value: overview?.out_of_stock_products.length || 0,
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            link: '/products?stockStatus=out_of_stock',
            resource: 'products'
        },
        {
            title: 'Estoque Baixo',
            value: overview?.low_stock_products.length || 0,
            icon: AlertTriangle,
            color: 'text-amber-600 dark:text-amber-300',
            bgColor: 'bg-amber-100 dark:bg-amber-900/40',
            link: '/products?stockStatus=low_stock',
            resource: 'products'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Visão geral e métricas principais do seu estoque.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const hasPermission = canView(stat.resource);

                    const CardContentWrapper = (
                        <Card className={`h-full ${hasPermission ? 'hover:shadow-md transition-shadow cursor-pointer' : 'opacity-90'}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {stat.title}
                                </CardTitle>
                                <div className={`${stat.bgColor} p-2 rounded-full`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
                            </CardContent>
                        </Card>
                    );

                    if (hasPermission) {
                        return (
                            <Link key={stat.title} to={stat.link} className="block">
                                {CardContentWrapper}
                            </Link>
                        );
                    }

                    return (
                        <div key={stat.title} className="block cursor-default">
                            {CardContentWrapper}
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesTrendChart days={30} />
                <TopProductsChart limit={5} />
            </div>

            {/* ABC Distribution - Full Width */}
            <ABCDistributionChart />

            {/* Recent Movements */}
            {canView('movements') && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Últimas Movimentações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentMovements.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">
                                    Nenhuma movimentação registrada
                                </p>
                            ) : (
                                recentMovements.slice(0, 5).map((movement) => (
                                    <div key={movement.id} className="flex items-center">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center mr-4 ${movement.type === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {movement.type === 'entrada' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {movement.product.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatDateTime(movement.created_at)}
                                            </p>
                                        </div>
                                        <div className={`font-medium ${movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                            {movement.type === 'entrada' ? '+' : '-'}{formatNumber(movement.quantity)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Low Stock Alert */}
            {canView('products') && (overview?.low_stock_products || []).length > 0 && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/20">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-100">
                            <AlertTriangle className="w-5 h-5" />
                            Atenção: Produtos com Estoque Baixo
                        </CardTitle>
                        <Link to="/products?stockStatus=low_stock" className="text-sm text-amber-800 dark:text-amber-100 hover:underline font-medium">
                            Ver todos
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(overview?.low_stock_products || []).slice(0, 6).map((product: any) => (
                                <div key={product.id} className="bg-white p-3 rounded-lg border border-amber-100 dark:border-amber-700/50 shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-slate-900">{product.name}</p>
                                        <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                                    </div>
                                    <Badge variant="outline" className="text-amber-700 dark:text-amber-100 border-yellow-200 bg-amber-50 dark:bg-amber-900/30">
                                        {product.quantity} un.
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}




