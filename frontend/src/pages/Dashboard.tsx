import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { reportService, type StockOverview } from '@/services/reportService';
import { movementService } from '@/services/movementService';
import type { Movement } from '@/types';
import { Package, TrendingDown, TrendingUp, DollarSign, AlertTriangle, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

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

    // Prepare data for the chart
    const chartData = recentMovements.slice(0, 7).reverse().map(m => ({
        name: m.product.name.substring(0, 10) + '...',
        quantidade: m.type === 'entrada' ? m.quantity : -m.quantity,
        type: m.type
    }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-2">Visão geral e métricas principais do seu estoque.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.title} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                {stat.title}
                            </CardTitle>
                            <div className={`${stat.bgColor} p-2 rounded-full`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                {/* Chart Section */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Fluxo de Movimentações
                        </CardTitle>
                        <CardDescription>
                            Entradas e saídas recentes de produtos
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.type === 'entrada' ? '#22c55e' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-400">
                                    Sem dados suficientes para o gráfico
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Movements List */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Últimas Movimentações
                        </CardTitle>
                        <CardDescription>
                            Histórico recente de operações
                        </CardDescription>
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
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center mr-4 ${movement.type === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {movement.type === 'entrada' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {movement.product.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(movement.created_at).toLocaleDateString('pt-BR')} às {new Date(movement.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className={`font-medium ${movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Alert */}
            {(overview?.low_stock_products || []).length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800">
                            <AlertTriangle className="w-5 h-5" />
                            Atenção: Produtos com Estoque Baixo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(overview?.low_stock_products || []).slice(0, 6).map((product: any) => (
                                <div key={product.id} className="bg-white p-3 rounded-lg border border-yellow-100 shadow-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-slate-900">{product.name}</p>
                                        <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                                    </div>
                                    <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50">
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
