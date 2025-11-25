import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import dashboardService from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopProductsChartProps {
    limit?: number;
}

export function TopProductsChart({ limit = 5 }: TopProductsChartProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await dashboardService.getTopProducts(limit);

                // Transform data for recharts
                const chartData = response.labels.map((label: string, index: number) => ({
                    name: label.length > 20 ? label.substring(0, 20) + '...' : label,
                    vendas: response.data[index]
                }));

                setData(chartData);
                setError(null);
            } catch (err) {
                console.error('Error loading top products:', err);
                setError('Erro ao carregar produtos mais vendidos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [limit]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top {limit} Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando...</p>
                </CardContent>
            </Card>
        );
    }

    if (error || !data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top {limit} Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">{error || 'Sem dados disponíveis'}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top {limit} Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="name"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px'
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend />
                        <Bar
                            dataKey="vendas"
                            fill="hsl(var(--primary))"
                            name="Vendas (unidades)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
