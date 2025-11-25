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
import { BarChart3, TrendingUp, DollarSign, HelpCircle, Activity, RefreshCw, AlertTriangle, Download, FileText, FileSpreadsheet, Star, CheckCircle2, XCircle } from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { PeriodSelector } from '@/components/PeriodSelector';
import { InsightCard } from '@/components/ReportsInsights';
import { exportToPDF, exportToCSV } from '@/utils/export';
import { toast } from 'sonner';

export default function ReportsPage() {
    const [abcData, setAbcData] = useState<ABCItem[]>([]);
    const [xyzData, setXyzData] = useState<XYZItem[]>([]);
    const [turnoverData, setTurnoverData] = useState<TurnoverItem[]>([]);
    const [financialData, setFinancialData] = useState<FinancialReport | null>(null);
    const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [helpDialogOpen, setHelpDialogOpen] = useState(false);
    const [period, setPeriod] = useState('30d');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [activeTab, setActiveTab] = useState('abc');

    useEffect(() => {
        if (period !== 'custom') {
            loadData();
        }
    }, [period]);

    const handleCustomDateApply = () => {
        if (period === 'custom' && customDates.start && customDates.end) {
            loadData();
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = period === 'custom'
                ? { start_date: customDates.start, end_date: customDates.end }
                : { period };

            const [abc, xyz, turnover, financial, forecast] = await Promise.all([
                reportService.getABC(params),
                reportService.getXYZ(params),
                reportService.getTurnover(params),
                reportService.getFinancial(params),
                reportService.getForecast(params),
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

    const handleExportPDF = () => {
        try {
            if (activeTab === 'abc') {
                const headers = ['Produto', 'Classe', 'Valor', '% Individual', '% Acumulado'];
                const data = abcData.map(item => [
                    item.product_name,
                    item.classification,
                    `R$ ${item.value.toFixed(2)}`,
                    `${item.percentage.toFixed(2)}%`,
                    `${item.cumulative_percentage.toFixed(2)}%`
                ]);
                exportToPDF('Relatório Curva ABC', headers, data, 'curva_abc');
            } else if (activeTab === 'xyz') {
                const headers = ['Produto', 'Classe', 'Coef. Variação'];
                const data = xyzData.map(item => [
                    item.product_name,
                    item.classification,
                    item.cv.toFixed(3)
                ]);
                exportToPDF('Relatório Análise XYZ', headers, data, 'analise_xyz');
            } else if (activeTab === 'turnover') {
                const headers = ['Produto', 'Taxa de Giro', 'Estoque Médio', 'Total Vendido'];
                const data = turnoverData.map(item => [
                    item.product_name,
                    `${item.turnover_rate.toFixed(2)}x`,
                    item.avg_inventory.toFixed(1),
                    item.total_sales.toString()
                ]);
                exportToPDF('Relatório Giro de Estoque', headers, data, 'giro_estoque');
            } else if (activeTab === 'forecast') {
                const headers = ['Produto', 'Consumo Diário', 'Dias Restantes', 'Ponto de Pedido', 'Status'];
                const data = forecastData.map(item => [
                    item.product_name,
                    item.daily_usage.toFixed(2),
                    item.days_until_stockout > 365 ? '> 1 ano' : item.days_until_stockout.toFixed(0),
                    item.reorder_point.toString(),
                    item.status
                ]);
                exportToPDF('Relatório Previsão de Estoque', headers, data, 'previsao_estoque');
            }
            toast.success('Relatório exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            toast.error('Erro ao exportar relatório.');
        }
    };

    const handleExportCSV = () => {
        try {
            if (activeTab === 'abc') {
                const data = abcData.map(item => ({
                    'Produto': item.product_name,
                    'Classe': item.classification,
                    'Valor': item.value.toFixed(2),
                    '% Individual': item.percentage.toFixed(2),
                    '% Acumulado': item.cumulative_percentage.toFixed(2)
                }));
                exportToCSV(data, 'curva_abc');
            } else if (activeTab === 'xyz') {
                const data = xyzData.map(item => ({
                    'Produto': item.product_name,
                    'Classe': item.classification,
                    'Coef. Variação': item.cv.toFixed(3)
                }));
                exportToCSV(data, 'analise_xyz');
            } else if (activeTab === 'turnover') {
                const data = turnoverData.map(item => ({
                    'Produto': item.product_name,
                    'Taxa de Giro': item.turnover_rate.toFixed(2),
                    'Estoque Médio': item.avg_inventory.toFixed(1),
                    'Total Vendido': item.total_sales
                }));
                exportToCSV(data, 'giro_estoque');
            } else if (activeTab === 'forecast') {
                const data = forecastData.map(item => ({
                    'Produto': item.product_name,
                    'Consumo Diário': item.daily_usage.toFixed(2),
                    'Dias Restantes': item.days_until_stockout.toFixed(0),
                    'Ponto de Pedido': item.reorder_point,
                    'Status': item.status
                }));
                exportToCSV(data, 'previsao_estoque');
            }
            toast.success('Relatório CSV exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar CSV:', error);
            toast.error('Erro ao exportar relatório CSV.');
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
        const icons: Record<string, any> = {
            A: Star,
            X: TrendingUp,
            Z: AlertTriangle
        };
        const Icon = icons[classification];
        return (
            <Badge className={`${colors[classification] || 'bg-slate-600'} gap-1`}>
                {Icon && <Icon className="w-3 h-3" />}
                {classification}
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            OK: 'default',
            WARNING: 'secondary',
            CRITICAL: 'destructive',
        };
        const icons: Record<string, any> = {
            OK: CheckCircle2,
            WARNING: AlertTriangle,
            CRITICAL: XCircle
        };
        const Icon = icons[status];
        return (
            <Badge variant={variants[status] || 'default'} className="gap-1">
                {Icon && <Icon className="w-3 h-3" />}
                {status}
            </Badge>
        );
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

    // Calculate Insights
    const abcInsight = (() => {
        const classA = abcData.filter(i => i.classification === 'A');
        const totalValue = abcData.reduce((acc, item) => acc + item.value, 0);
        const valueA = classA.reduce((acc, item) => acc + item.value, 0);
        const percentA = totalValue > 0 ? (valueA / totalValue * 100).toFixed(1) : '0';
        return {
            count: classA.length,
            percent: percentA,
            value: valueA
        };
    })();

    const xyzInsight = (() => {
        const classX = xyzData.filter(i => i.classification === 'X');
        return { count: classX.length };
    })();

    const turnoverInsight = (() => {
        if (turnoverData.length === 0) return null;
        const top = [...turnoverData].sort((a, b) => b.turnover_rate - a.turnover_rate)[0];
        return top;
    })();

    const forecastInsight = (() => {
        const critical = forecastData.filter(i => i.status === 'CRITICAL');
        return { count: critical.length, items: critical };
    })();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="mb-8 flex items-center justify-between">
                <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <HelpCircle className="w-4 h-4" />
                            Ajuda
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Entendendo os Relatórios</DialogTitle>
                            <DialogDescription>
                                Explicações sobre cada tipo de relatório e como interpretá-los
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* ABC Analysis */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                    📈 Curva ABC
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    A análise ABC classifica produtos por valor de estoque (Princípio de Pareto):
                                </p>
                                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    <li>• <strong className="text-green-600">Classe A</strong>: ~20% dos produtos que representam ~80% do valor total. São os itens mais importantes.</li>
                                    <li>• <strong className="text-blue-600">Classe B</strong>: ~30% dos produtos que representam ~15% do valor. Itens de importância média.</li>
                                    <li>• <strong className="text-slate-600">Classe C</strong>: ~50% dos produtos que representam ~5% do valor. Itens menos prioritários.</li>
                                </ul>
                            </div>

                            {/* XYZ Analysis */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                    📊 Análise XYZ
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    A análise XYZ classifica produtos pela previsibilidade da demanda:
                                </p>
                                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    <li>• <strong className="text-green-600">Classe X</strong>: Demanda estável e previsível (CV {'<'} 0.5). Fácil de planejar.</li>
                                    <li>• <strong className="text-yellow-600">Classe Y</strong>: Demanda com variações moderadas (CV 0.5-1.0).</li>
                                    <li>• <strong className="text-red-600">Classe Z</strong>: Demanda irregular e imprevisível (CV {'>'} 1.0). Difícil de prever.</li>
                                </ul>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    <em>CV = Coeficiente de Variação. Quanto menor, mais previsível é a demanda.</em>
                                </p>
                            </div>

                            {/* Turnover */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                    🔄 Giro de Estoque
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    O giro de estoque mostra quantas vezes o estoque é renovado em um período:
                                </p>
                                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    <li>• <strong>Taxa de Giro</strong>: Total vendido ÷ Estoque médio. Valores maiores indicam renovação mais rápida.</li>
                                    <li>• <strong>Estoque Médio</strong>: Média da quantidade em estoque no período.</li>
                                    <li>• <strong>Total Vendido</strong>: Quantidade total de saídas no período.</li>
                                </ul>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    <em>Exemplo: Taxa de 0.5x significa que você vendeu metade do estoque médio em 30 dias.</em>
                                </p>
                            </div>

                            {/* Forecast */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                    🔮 Previsão de Estoque
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    A previsão ajuda a evitar rupturas de estoque:
                                </p>
                                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                    <li>• <strong>Consumo Diário</strong>: Média de unidades vendidas por dia.</li>
                                    <li>• <strong>Dias Restantes</strong>: Quantos dias até o estoque acabar (baseado no consumo atual).</li>
                                    <li>• <strong>Ponto de Pedido</strong>: Quantidade mínima antes de fazer novo pedido (considera o tempo de entrega).</li>
                                    <li>• <strong>Status</strong>:
                                        <ul className="ml-4 mt-1">
                                            <li>- <Badge variant="default" className="text-xs">OK</Badge>: Estoque adequado</li>
                                            <li>- <Badge variant="secondary" className="text-xs">WARNING</Badge>: Atenção, estoque baixando</li>
                                            <li>- <Badge variant="destructive" className="text-xs">CRITICAL</Badge>: Repor urgentemente!</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Exportar
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                            <FileText className="w-4 h-4" />
                            PDF (Relatório)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                            <FileSpreadsheet className="w-4 h-4" />
                            CSV (Dados)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex justify-end">
                <PeriodSelector
                    value={period}
                    onChange={setPeriod}
                    startDate={customDates.start}
                    endDate={customDates.end}
                    onApply={handleCustomDateApply}
                />
            </div>

            {/* Financial Summary Cards */}
            {financialData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                Valor em Estoque
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                                        <TooltipContent><p>Soma do preço de venda de todos os produtos em estoque.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
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
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                Custo Total
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                                        <TooltipContent><p>Soma do preço de custo de todos os produtos em estoque.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
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
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                Lucro Potencial
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                                        <TooltipContent><p>Diferença entre Valor em Estoque e Custo Total (Lucro Bruto estimado).</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
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
                            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                Margem Média
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><HelpCircle className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                                        <TooltipContent><p>Média percentual de lucro sobre o custo dos produtos.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <TabsTrigger value="abc" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Curva ABC</TabsTrigger>
                    <TabsTrigger value="xyz" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Análise XYZ</TabsTrigger>
                    <TabsTrigger value="turnover" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Giro de Estoque</TabsTrigger>
                    <TabsTrigger value="forecast" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">Previsão</TabsTrigger>
                </TabsList>

                {/* ABC Analysis */}
                <TabsContent value="abc" className="space-y-6">
                    <InsightCard
                        icon={<TrendingUp className="w-6 h-6 text-green-600" />}
                        title="Produtos Mais Valiosos"
                        value={`${abcInsight.count} itens (Classe A)`}
                        description={`Estes produtos representam ${abcInsight.percent}% do valor total do estoque (R$ ${abcInsight.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Mantenha o foco neles!`}
                        variant="success"
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Distribuição ABC
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger><HelpCircle className="w-4 h-4 text-slate-400" /></TooltipTrigger>
                                            <TooltipContent><p>Classificação de produtos por valor (Pareto 80/20).</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </CardTitle>
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
                                            <RechartsTooltip />
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
                <TabsContent value="xyz" className="space-y-6">
                    <InsightCard
                        icon={<Activity className="w-6 h-6 text-blue-600" />}
                        title="Produtos Estáveis"
                        value={`${xyzInsight.count} itens (Classe X)`}
                        description="Estes produtos têm demanda previsível e constante. Você pode planejar reposições automáticas com segurança."
                        variant="info"
                    />
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Análise XYZ - Variabilidade da Demanda
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><HelpCircle className="w-4 h-4 text-slate-400" /></TooltipTrigger>
                                        <TooltipContent>
                                            <p>X: Demanda constante (fácil prever)</p>
                                            <p>Y: Demanda variável (sazonal)</p>
                                            <p>Z: Demanda irregular (difícil prever)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
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
                <TabsContent value="turnover" className="space-y-6">
                    {turnoverInsight && (
                        <InsightCard
                            icon={<RefreshCw className="w-6 h-6 text-orange-600" />}
                            title="Maior Giro de Estoque"
                            value={`${turnoverInsight?.product_name} (${turnoverInsight?.turnover_rate.toFixed(2)}x)`}
                            description="Este é o produto que vende mais rápido em relação ao estoque mantido. Considere aumentar o estoque para evitar rupturas."
                            variant="warning"
                        />
                    )}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Giro de Estoque
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><HelpCircle className="w-4 h-4 text-slate-400" /></TooltipTrigger>
                                        <TooltipContent><p>Velocidade com que o estoque é vendido e reposto.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
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
                <TabsContent value="forecast" className="space-y-6">
                    <InsightCard
                        icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
                        title="Risco de Ruptura"
                        value={`${forecastInsight.count} produtos críticos`}
                        description={forecastInsight.count > 0
                            ? `Atenção! ${forecastInsight.count} produtos estão com estoque zerado ou muito baixo. Faça pedidos de reposição urgente.`
                            : "Ótimo! Nenhum produto está com risco iminente de falta de estoque."}
                        variant={forecastInsight.count > 0 ? "danger" : "success"}
                    />
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Previsão de Estoque
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><HelpCircle className="w-4 h-4 text-slate-400" /></TooltipTrigger>
                                        <TooltipContent><p>Estimativa de quando o estoque acabará baseado no consumo diário.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardTitle>
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
        </div >
    );
}
