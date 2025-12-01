import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { reportService, type ABCItem, type XYZItem, type TurnoverItem, type FinancialReport, type ForecastItem } from '@/services/reportService';
import { exportToCSV, exportToPDF } from '@/utils/export';
import { usePermissions } from '@/hooks/usePermissions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function ReportsPage() {
    const { canExport } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [financial, setFinancial] = useState<FinancialReport | null>(null);
    const [abc, setAbc] = useState<ABCItem[]>([]);
    const [xyz, setXyz] = useState<XYZItem[]>([]);
    const [turnover, setTurnover] = useState<TurnoverItem[]>([]);
    const [forecast, setForecast] = useState<ForecastItem[]>([]);
    const [abcPageSize, setAbcPageSize] = useState(20);
    const [xyzPageSize, setXyzPageSize] = useState(20);
    const [turnoverPageSize, setTurnoverPageSize] = useState(20);
    const [forecastPageSize, setForecastPageSize] = useState(20);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [fin, abcData, xyzData, turnoverData, forecastData] = await Promise.all([
                    reportService.getFinancial(),
                    reportService.getABC(),
                    reportService.getXYZ(),
                    reportService.getTurnover(),
                    reportService.getForecast(),
                ]);
                setFinancial(fin);
                setAbc(abcData.items || []);
                setXyz(xyzData.items || []);
                setTurnover(turnoverData.items || []);
                setForecast(forecastData.items || []);
            } catch (error) {
                console.error('Erro ao carregar relatórios', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const abcCounts = useMemo(() => {
        const counts = { A: 0, B: 0, C: 0 };
        abc.forEach((item) => {
            counts[item.classification as 'A' | 'B' | 'C'] += 1;
        });
        return counts;
    }, [abc]);

    const paginated = {
        abc: useMemo(() => abc.slice(0, abcPageSize), [abc, abcPageSize]),
        xyz: useMemo(() => xyz.slice(0, xyzPageSize), [xyz, xyzPageSize]),
        turnover: useMemo(() => turnover.slice(0, turnoverPageSize), [turnover, turnoverPageSize]),
        forecast: useMemo(() => forecast.slice(0, forecastPageSize), [forecast, forecastPageSize]),
    };

    const riskCounters = useMemo(() => {
        const critical = forecast.filter((f) => f.status === 'CRITICAL').length;
        const warning = forecast.filter((f) => f.status === 'WARNING').length;
        const ok = forecast.filter((f) => f.status === 'OK').length;
        return { critical, warning, ok };
    }, [forecast]);

    const handleExportCSV = () => {
        const data = abc.map((i) => ({
            produto: i.product_name,
            classe: i.classification,
            valor: i.value,
            percentual: i.percentage,
            percentual_acumulado: i.cumulative_percentage,
        }));
        exportToCSV(data, 'relatorio_abc');
    };

    const handleExportPDF = () => {
        const headers = ['Produto', 'Classe', 'Valor', '% Individual', '% Acumulado'];
        const rows = abc.slice(0, 20).map((i) => [
            i.product_name,
            i.classification,
            `R$ ${i.value.toFixed(2)}`,
            `${i.percentage.toFixed(2)}%`,
            `${i.cumulative_percentage.toFixed(2)}%`,
        ]);
        exportToPDF('Relatório ABC', headers, rows, 'relatorio_abc');
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Carregando relatórios...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
                    <p className="text-muted-foreground mt-1">Visão financeira e saúde do estoque</p>
                </div>
                {canExport('reports') && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                            <FileText className="w-4 h-4" /> PDF
                        </Button>
                        <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> CSV
                        </Button>
                    </div>
                )}
            </div>

            {financial && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard title="Valor em Estoque" value={financial.total_inventory_value} prefix="R$" />
                    <SummaryCard title="Custo Total" value={financial.total_cost_value} prefix="R$" />
                    <SummaryCard title="Lucro Potencial" value={financial.potential_profit} prefix="R$" />
                    <SummaryCard title="Margem Média" value={financial.average_margin} suffix="%" />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">ABC (quantidade)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Badge variant="default">A: {abcCounts.A}</Badge>
                        <Badge variant="secondary">B: {abcCounts.B}</Badge>
                        <Badge variant="outline">C: {abcCounts.C}</Badge>
                    </CardContent>
                </Card>
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Risco de ruptura</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Badge variant="destructive">Crítico: {riskCounters.critical}</Badge>
                        <Badge variant="secondary">Alerta: {riskCounters.warning}</Badge>
                        <Badge variant="default">OK: {riskCounters.ok}</Badge>
                    </CardContent>
                </Card>
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Itens exibidos</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Ajuste a quantidade em cada aba para explorar mais dados.
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="abc" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="abc">Curva ABC</TabsTrigger>
                    <TabsTrigger value="xyz">Análise XYZ</TabsTrigger>
                    <TabsTrigger value="turnover">Giro</TabsTrigger>
                    <TabsTrigger value="forecast">Previsão</TabsTrigger>
                </TabsList>

                <TabsContent value="abc" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle>Distribuição ABC</CardTitle>
                                    <CardDescription>Quantidade de produtos por classe</CardDescription>
                                </div>
                                <Select
                                    value={abcPageSize === abc.length ? 'all' : abcPageSize.toString()}
                                    onValueChange={(val) => setAbcPageSize(val === 'all' ? abc.length || 20 : parseInt(val))}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Itens" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">Top 20</SelectItem>
                                        <SelectItem value="50">Top 50</SelectItem>
                                        <SelectItem value="100">Top 100</SelectItem>
                                        <SelectItem value="all">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="default">A: {abcCounts.A}</Badge>
                                <Badge variant="secondary">B: {abcCounts.B}</Badge>
                                <Badge variant="outline">C: {abcCounts.C}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Curva ABC - Detalhada</CardTitle>
                            <CardDescription>Top 20 itens por valor consumido</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <div className="max-h-[420px] overflow-auto border rounded-md">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Classe</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead className="text-right">% Individual</TableHead>
                                            <TableHead className="text-right">% Acumulado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {abc.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                                    Sem dados para ABC
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginated.abc.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>{item.product_name}</TableCell>
                                                    <TableCell>{item.classification}</TableCell>
                                                    <TableCell className="text-right">R$ {item.value.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                                                    <TableCell className="text-right">{item.cumulative_percentage.toFixed(2)}%</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="xyz">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle>Demanda (XYZ)</CardTitle>
                                    <CardDescription>Variabilidade da demanda por produto</CardDescription>
                                </div>
                                <Select
                                    value={xyzPageSize === xyz.length ? 'all' : xyzPageSize.toString()}
                                    onValueChange={(val) => setXyzPageSize(val === 'all' ? xyz.length || 20 : parseInt(val))}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Itens" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">Top 20</SelectItem>
                                        <SelectItem value="50">Top 50</SelectItem>
                                        <SelectItem value="100">Top 100</SelectItem>
                                        <SelectItem value="all">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <div className="max-h-[420px] overflow-auto border rounded-md">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead>Classe</TableHead>
                                            <TableHead className="text-right">CV</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {xyz.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                                    Sem dados para XYZ
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginated.xyz.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>{item.product_name}</TableCell>
                                                    <TableCell>{item.classification}</TableCell>
                                                    <TableCell className="text-right">{item.cv.toFixed(3)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="turnover">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle>Giro de Estoque</CardTitle>
                                    <CardDescription>Relação vendas / estoque médio</CardDescription>
                                </div>
                                <Select
                                    value={turnoverPageSize === turnover.length ? 'all' : turnoverPageSize.toString()}
                                    onValueChange={(val) => setTurnoverPageSize(val === 'all' ? turnover.length || 20 : parseInt(val))}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Itens" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">Top 20</SelectItem>
                                        <SelectItem value="50">Top 50</SelectItem>
                                        <SelectItem value="100">Top 100</SelectItem>
                                        <SelectItem value="all">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <div className="max-h-[420px] overflow-auto border rounded-md">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="text-right">Taxa de Giro</TableHead>
                                            <TableHead className="text-right">Estoque Médio</TableHead>
                                            <TableHead className="text-right">Total Vendido</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {turnover.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                                    Sem dados de giro
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginated.turnover.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>{item.product_name}</TableCell>
                                                    <TableCell className="text-right">{item.turnover_rate.toFixed(2)}x</TableCell>
                                                    <TableCell className="text-right">{item.avg_inventory.toFixed(1)}</TableCell>
                                                    <TableCell className="text-right">{item.total_sales}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="forecast">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle>Previsão de Estoque</CardTitle>
                                    <CardDescription>Risco de ruptura e ponto de pedido</CardDescription>
                                </div>
                                <Select
                                    value={forecastPageSize === forecast.length ? 'all' : forecastPageSize.toString()}
                                    onValueChange={(val) => setForecastPageSize(val === 'all' ? forecast.length || 20 : parseInt(val))}
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Itens" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20">Top 20</SelectItem>
                                        <SelectItem value="50">Top 50</SelectItem>
                                        <SelectItem value="100">Top 100</SelectItem>
                                        <SelectItem value="all">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <div className="max-h-[420px] overflow-auto border rounded-md">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="text-right">Consumo Diário</TableHead>
                                            <TableHead className="text-right">Dias Restantes</TableHead>
                                            <TableHead className="text-right">Ponto de Pedido</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {forecast.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                                    Sem dados de previsão
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginated.forecast.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>{item.product_name}</TableCell>
                                                    <TableCell className="text-right">{item.daily_usage.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {item.days_until_stockout > 365 ? '> 1 ano' : `${item.days_until_stockout.toFixed(0)} dias`}
                                                    </TableCell>
                                                    <TableCell className="text-right">{item.reorder_point}</TableCell>
                                                    <TableCell className="text-center">
                                                        <StatusBadge status={item.status} />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SummaryCard({ title, value, prefix, suffix }: { title: string; value: number; prefix?: string; suffix?: string }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">
                    {prefix} {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {suffix}
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: ForecastItem['status'] }) {
    if (status === 'CRITICAL') return <Badge variant="destructive">Crítico</Badge>;
    if (status === 'WARNING') return <Badge variant="secondary">Alerta</Badge>;
    return <Badge variant="default">OK</Badge>;
}
