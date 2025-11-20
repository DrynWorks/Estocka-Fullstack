import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { reportService, type StockOverview } from '@/services/reportService';
import { movementService, type Movement } from '@/services/movementService';
import { Package, TrendingDown, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
    const [overview, setOverview] = useState<StockOverview | null>(null);
    const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [overviewData, movements] = await Promise.all([
                reportService.getOverview(),
                movementService.getRecent(10),
            ]);
            setOverview(overviewData);
            setRecentMovements(movements);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-slate-600">Carregando...</div>
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
        },
        {
            title: 'Valor em Estoque',
            value: `R$ ${(overview?.total_stock_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Produtos em Falta',
            value: overview?.out_of_stock_products.length || 0,
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
        },
        {
            title: 'Estoque Baixo',
            value: overview?.low_stock_products.length || 0,
            icon: AlertTriangle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1">Visão geral do sistema de estoque</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                {stat.title}
                            </CardTitle>
                            <div className={`${stat.bgColor} p-2 rounded-lg`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Movements */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Movimentações Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentMovements.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    Nenhuma movimentação registrada
                                </p>
                            ) : (
                                recentMovements.map((movement) => (
                                    <div
                                        key={movement.id}
                                        className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">
                                                {movement.product.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(movement.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={movement.type === 'entrada' ? 'default' : 'destructive'}
                                            className="ml-2"
                                        >
                                            {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            Produtos com Estoque Baixo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(overview?.low_stock_products || []).length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">
                                    Todos os produtos com estoque adequado
                                </p>
                            ) : (
                                (overview?.low_stock_products || []).slice(0, 5).map((product: any) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900">{product.name}</p>
                                            <p className="text-xs text-slate-500">{product.sku}</p>
                                        </div>
                                        <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                            {product.quantity} un.
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
