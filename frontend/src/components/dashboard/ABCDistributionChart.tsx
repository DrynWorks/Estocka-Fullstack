import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import dashboardService from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = {
    A: 'hsl(var(--chart-1))',
    B: 'hsl(var(--chart-2))',
    C: 'hsl(var(--chart-3))',
};

export function ABCDistributionChart() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await dashboardService.getABCDistribution();

                const entries = Object.entries(response || {});
                const total = entries.reduce((acc, [, v]) => acc + (v as number), 0);

                const chartData =
                    total > 0
                        ? entries.map(([key, value]) => ({
                            name: `Classe ${key}`,
                            value: value as number,
                            percentage: ((value as number) * 100 / total).toFixed(1)
                        }))
                        : [];

                setData(chartData);
                setError(null);
            } catch (err) {
                console.error('Error loading ABC distribution:', err);
                setError('Erro ao carregar distribuição ABC');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição ABC de Produtos</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando...</p>
                </CardContent>
            </Card>
        );
    }

    if (error || !data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição ABC de Produtos</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">{error || 'Sem dados disponíveis'}</p>
                </CardContent>
            </Card>
        );
    }

    const renderCustomLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-sm font-semibold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribuição ABC de Produtos</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Classificação por importância no estoque
                </p>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry: any, index: number) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name.split(' ')[1] as keyof typeof COLORS]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px'
                            }}
                            formatter={(value: any, name: any, props: any) => [
                                `${value} produtos (${props.payload.percentage}%)`,
                                name
                            ]}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry: any) => {
                                const item = data.find((d: any) => d.name === entry.payload.name);
                                return `${value}: ${item?.value} produtos (${item?.percentage}%)`;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
