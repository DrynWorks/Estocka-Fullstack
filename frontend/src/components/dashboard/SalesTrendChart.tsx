import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import dashboardService from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesTrendChartProps {
    days?: number;
}

export function SalesTrendChart({ days = 30 }: SalesTrendChartProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await dashboardService.getSalesTrend(days);

                // Transform data for recharts
                const chartData = response.labels.map((label: string, index: number) => ({
                    date: label,
                    vendas: response.data[index]
                }));

                setData(chartData);
                setError(null);
            } catch (err) {
                console.error('Error loading sales trend:', err);
                setError('Erro ao carregar tendência de vendas');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [days]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Tendência de Vendas ({days} dias)</CardTitle>
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
                    <CardTitle>Tendência de Vendas ({days} dias)</CardTitle>
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
                <CardTitle>Tendência de Vendas ({days} dias)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                        <Line
                            type="monotone"
                            dataKey="vendas"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                            activeDot={{ r: 6 }}
                            name="Vendas (unidades)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
