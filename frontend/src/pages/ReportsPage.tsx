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
            A: 'bg-green-600',
            B: 'bg-blue-600',
            C: 'bg-slate-600',
            X: 'bg-green-600',
            Y: 'bg-yellow-600',
            Z: 'bg-red-600',
        };
        return <Badge className={colors[classification] || 'bg-slate-600'}>{classification}</Badge>;
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            OK: 'default',
            WARNING: 'outline',
            CRITICAL: 'destructive',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-slate-600">Carregando relatórios...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Relatórios Analíticos</h1>
                <p className="text-slate-600 mt-1">Análises avançadas para gestão estratégica de estoque</p>
            </div>

            {/* Financial Summary Cards */}
            {financialData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
                            <DollarSign className="w-4 h-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                R$ {financialData.total_inventory_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                            <DollarSign className="w-4 h-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                R$ {financialData.total_cost_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lucro Potencial</CardTitle>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                R$ {financialData.potential_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{financialData.average_margin.toFixed(2)}%</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs for different reports */}
            <Tabs defaultValue="abc" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="abc">Curva ABC</TabsTrigger>
                    <TabsTrigger value="xyz">Análise XYZ</TabsTrigger>
                    <TabsTrigger value="turnover">Giro de Estoque</TabsTrigger>
                    <TabsTrigger value="forecast">Previsão</TabsTrigger>
                </TabsList>

                {/* ABC Analysis */}
                <TabsContent value="abc">
                    <Card>
                        <CardHeader>
                            <CardTitle>Curva ABC - Classificação por Valor</CardTitle>
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
                                            <TableCell colSpan={5} className="text-center text-slate-500">
                                                Sem dados suficientes para análise ABC
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        abcData.map((item) => (
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
                                            <TableCell colSpan={3} className="text-center text-slate-500">
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
                                            <TableCell colSpan={4} className="text-center text-slate-500">
                                                Sem dados de movimentação
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        turnoverData.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell className="font-medium">{item.product_name}</TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {item.turnover_rate.toFixed(2)}x
                                                </TableCell>
                                                <TableCell className="text-right">{item.avg_inventory.toFixed(0)}</TableCell>
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
                            <CardTitle>Previsão e Ponto de Pedido</CardTitle>
                            <CardDescription>
                                Análise de risco de ruptura e pontos ideais de reposição
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead className="text-right">Uso Diário</TableHead>
                                        <TableHead className="text-right">Dias p/ Ruptura</TableHead>
                                        <TableHead className="text-right">Ponto de Pedido</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {forecastData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-slate-500">
                                                Sem dados de previsão
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        forecastData.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell className="font-medium">{item.product_name}</TableCell>
                                                <TableCell className="text-right">{item.daily_usage.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.days_until_stockout === 999 ? '∞' : item.days_until_stockout.toFixed(0)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{item.reorder_point}</TableCell>
                                                <TableCell>{getStatusBadge(item.status)}</TableCell>
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
