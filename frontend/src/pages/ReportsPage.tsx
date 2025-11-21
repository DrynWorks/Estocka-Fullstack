import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { reportService, type ABCItem, type XYZItem, type TurnoverItem, type FinancialReport, type ForecastItem } from '@/services/reportService';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

export default function ReportsPage() {
    const [abcData, setAbcData] = useState<ABCItem[]>([]);
    const [xyzData, setXyzData] = useState<XYZItem[]>([]);
    const [turnoverData, setTurnoverData] = useState<TurnoverItem[]>([]);
    const [financialData, setFinancialData] = useState<FinancialReport | null>(null);
    const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [abc, xyz, turnover, financial, forecast] = await Promise.all([
                reportService.getABC(),
                reportService.getXYZ(),
                reportService.getTurnover(),
                reportService.getFinancial(),
                reportService.getForecast(),
            ]);
            setAbcData(abc.items);
            setXyzData(xyz.items);
            setTurnoverData(turnover.items);
            setFinancialData(financial);
            setForecastData(forecast.items);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
        } finally {
            setLoading(false);
        }
    };

    const getClassificationBadge = (classification: string) => {
        const colors: Record<string, string> = {
            A: 'bg-green-600 hover:bg-green-700',
            B: 'bg-blue-600 hover:bg-blue-700',
            C: 'bg-slate-600 hover:bg-slate-700',
            X: 'bg-green-600 hover:bg-green-700',
            Y: 'bg-yellow-600 hover:bg-yellow-700',
            Z: 'bg-red-600 hover:bg-red-700',
        };
        return <Badge className={colors[classification] || 'bg-slate-600'}>{classification}</Badge>;
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            OK: 'default',
            WARNING: 'secondary',
            CRITICAL: 'destructive',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-slate-600 animate-pulse">Carregando relatórios...</div>
            </div>
        );
    }

    // Prepare data for charts
    const abcChartData = [
        { name: 'Classe A', value: abcData.filter(i => i.classification === 'A').length, color: '#16a34a' },
        { name: 'Classe B', value: abcData.filter(i => i.classification === 'B').length, color: '#2563eb' },
        { name: 'Classe C', value: abcData.filter(i => i.classification === 'C').length, color: '#475569' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight dark:text-slate-100">Relatórios Analíticos</h1>
                <p className="text-muted-foreground mt-1 dark:text-slate-400">
                    Análises avançadas para gestão estratégica de estoque
                </p>
            </div>

            {/* Financial Summary Cards */}
            {financialData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Valor em Estoque</CardTitle>
                            <div className="bg-green-100 p-2 rounded-full">
                                <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                R$ {financialData.total_inventory_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Custo Total</CardTitle>
                            <div className="bg-blue-100 p-2 rounded-full">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                R$ {financialData.total_cost_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Lucro Potencial</CardTitle>
                            <div className="bg-green-100 p-2 rounded-full">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                R$ {financialData.potential_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Margem Média</CardTitle>
                            <div className="bg-indigo-100 p-2 rounded-full">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{financialData.average_margin.toFixed(2)}%</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs for different reports */}
            <Tabs defaultValue="abc" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <TabsTrigger value="abc" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Curva ABC</TabsTrigger>
                    <TabsTrigger value="xyz" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Análise XYZ</TabsTrigger>
                    <TabsTrigger value="turnover" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Giro de Estoque</TabsTrigger>
                    <TabsTrigger value="forecast" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Previsão</TabsTrigger>
                </TabsList>

                {/* ABC Analysis */}
                <TabsContent value="abc" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Distribuição ABC</CardTitle>
                                <CardDescription>Quantidade de produtos por classe</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={abcChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {abcChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Curva ABC - Detalhada</CardTitle>
                                <CardDescription>
                                    Análise de Pareto: A (80% do valor), B (15% do valor), C (5% do valor)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Classe</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead className="text-right">% Individual</TableHead>
                                            <TableHead className="text-right">% Acumulado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {abcData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                                    Sem dados suficientes para análise ABC
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            abcData.slice(0, 10).map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell className="font-medium">{item.product_name}</TableCell>
                                                    <TableCell>{getClassificationBadge(item.classification)}</TableCell>
                                                    <TableCell className="text-right">
                                                        R$ {item.value.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {item.cumulative_percentage.toFixed(2)}%
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* XYZ Analysis */}
                <TabsContent value="xyz">
                    <Card>
                        <CardHeader>
                            <CardTitle>Análise XYZ - Variabilidade da Demanda</CardTitle>
                            <CardDescription>
                                X (demanda estável), Y (demanda variável), Z (demanda irregular)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead>Classe</TableHead>
                                        <TableHead className="text-right">Coef. Variação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {xyzData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                                                Sem dados suficientes para análise XYZ
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        xyzData.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell className="font-medium">{item.product_name}</TableCell>
                                                <TableCell>{getClassificationBadge(item.classification)}</TableCell>
                                                <TableCell className="text-right">{item.cv.toFixed(3)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Turnover */}
                <TabsContent value="turnover">
                    <Card>
                        <CardHeader>
                            <CardTitle>Giro de Estoque</CardTitle>
                            <CardDescription>
                                Taxa de renovação do estoque (últimos 30 dias)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead className="text-right">Taxa de Giro</TableHead>
                                        <TableHead className="text-right">Estoque Médio</TableHead>
                                        <TableHead className="text-right">Total Vendido</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {turnoverData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                                                Sem dados suficientes para análise de giro
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        turnoverData.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell className="font-medium">{item.product_name}</TableCell>
                                                <TableCell className="text-right">{item.turnover_rate.toFixed(2)}x</TableCell>
                                                <TableCell className="text-right">{item.avg_inventory.toFixed(1)}</TableCell>
                                                <TableCell className="text-right">{item.total_sales}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Forecast */}
                <TabsContent value="forecast">
                    <Card>
                        <CardHeader>
                            <CardTitle>Previsão de Estoque</CardTitle>
                            <CardDescription>
                                Análise de risco de ruptura e ponto de pedido
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead className="text-right">Consumo Diário</TableHead>
                                        <TableHead className="text-right">Dias Restantes</TableHead>
                                        <TableHead className="text-right">Ponto de Pedido</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {forecastData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                                Sem dados suficientes para previsão
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        forecastData.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell className="font-medium">{item.product_name}</TableCell>
                                                <TableCell className="text-right">{item.daily_usage.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.days_until_stockout > 365 ? '> 1 ano' : item.days_until_stockout.toFixed(0) + ' dias'}
                                                </TableCell>
                                                <TableCell className="text-right">{item.reorder_point}</TableCell>
                                                <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
