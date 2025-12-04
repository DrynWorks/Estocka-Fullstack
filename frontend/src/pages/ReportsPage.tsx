import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, HelpCircle } from "lucide-react";
import {
  reportService,
  type ABCItem,
  type XYZItem,
  type TurnoverItem,
  type FinancialReport,
  type ForecastItem,
} from "@/services/reportService";
import { exportToCSV, exportToPDF } from "@/utils/export";
import { usePermissions } from "@/hooks/usePermissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export default function ReportsPage() {
  const { canExport } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [abc, setAbc] = useState<ABCItem[]>([]);
  const [xyz, setXyz] = useState<XYZItem[]>([]);
  const [turnover, setTurnover] = useState<TurnoverItem[]>([]);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [itemsPageSize, setItemsPageSize] = useState<number | "all">(20);
  const [xyzFilter, setXyzFilter] = useState<"all" | "X" | "Y" | "Z">("all");
  const [forecastFilter, setForecastFilter] = useState<"all" | "CRITICAL" | "WARNING" | "OK">("all");
  const [activeTab, setActiveTab] = useState("abc");
  const [showHelpDialog, setShowHelpDialog] = useState(false);

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
        console.error("Erro ao carregar relatórios", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const abcCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 };
    let totalValue = 0;
    const valueByClass = { A: 0, B: 0, C: 0 };

    abc.forEach((item) => {
      const cls = item.classification as "A" | "B" | "C";
      counts[cls] += 1;
      valueByClass[cls] += item.value;
      totalValue += item.value;
    });

    return { counts, valueByClass, totalValue };
  }, [abc]);

  const abcChartData = useMemo(() => {
    return [
      { name: "Classe A", value: abcCounts.valueByClass.A, count: abcCounts.counts.A, color: "#16a34a" }, // green-600
      { name: "Classe B", value: abcCounts.valueByClass.B, count: abcCounts.counts.B, color: "#22c55e" }, // green-500
      { name: "Classe C", value: abcCounts.valueByClass.C, count: abcCounts.counts.C, color: "#86efac" }, // green-300
    ];
  }, [abcCounts]);

  const xyzChartData = useMemo(() => {
    const counts = { X: 0, Y: 0, Z: 0 };
    xyz.forEach((item) => {
      if (["X", "Y", "Z"].includes(item.classification)) {
        counts[item.classification as "X" | "Y" | "Z"] += 1;
      }
    });
    return [
      { name: "X", count: counts.X, color: "#22c55e" }, // green-500
      { name: "Y", count: counts.Y, color: "#eab308" }, // yellow-500
      { name: "Z", count: counts.Z, color: "#f97316" }, // orange-500
    ];
  }, [xyz]);

  const turnoverChartData = useMemo(() => {
    return [...turnover]
      .sort((a, b) => b.turnover_rate - a.turnover_rate)
      .slice(0, 5)
      .map((item) => ({
        name: item.product_name.length > 15 ? item.product_name.substring(0, 15) + "..." : item.product_name,
        full_name: item.product_name,
        rate: item.turnover_rate,
      }));
  }, [turnover]);

  const forecastChartData = useMemo(() => {
    const counts = { CRITICAL: 0, WARNING: 0, OK: 0 };
    forecast.forEach((item) => {
      if (["CRITICAL", "WARNING", "OK"].includes(item.status)) {
        counts[item.status as "CRITICAL" | "WARNING" | "OK"] += 1;
      }
    });
    return [
      { name: "Crítico", status: "CRITICAL", count: counts.CRITICAL, color: "#ef4444" }, // red-500
      { name: "Alerta", status: "WARNING", count: counts.WARNING, color: "#eab308" }, // yellow-500
      { name: "OK", status: "OK", count: counts.OK, color: "#22c55e" }, // green-500
    ];
  }, [forecast]);

  const applyLimit = <T,>(items: T[]) => (itemsPageSize === "all" ? items : items.slice(0, itemsPageSize));

  const paginated = {
    abc: useMemo(() => applyLimit(abc), [abc, itemsPageSize]),
    xyz: useMemo(() => applyLimit(xyz), [xyz, itemsPageSize]),
    turnover: useMemo(() => applyLimit(turnover), [turnover, itemsPageSize]),
    forecast: useMemo(() => applyLimit(forecast), [forecast, itemsPageSize]),
  };



  const handleExportCSV = () => {
    let data: any[] = [];
    let filename = "relatorio";

    switch (activeTab) {
      case "abc":
        data = abc.map((i) => ({
          produto: i.product_name,
          classe: i.classification,
          valor: i.value,
          percentual: i.percentage,
          percentual_acumulado: i.cumulative_percentage,
        }));
        filename = "relatorio_abc";
        break;
      case "xyz":
        data = xyz.map((i) => ({
          produto: i.product_name,
          classe: i.classification,
          cv: i.cv,
        }));
        filename = "relatorio_xyz";
        break;
      case "turnover":
        data = turnover.map((i) => ({
          produto: i.product_name,
          taxa_giro: i.turnover_rate,
          estoque_medio: i.avg_inventory,
          total_vendido: i.total_sales,
        }));
        filename = "relatorio_giro";
        break;
      case "forecast":
        data = forecast.map((i) => ({
          produto: i.product_name,
          consumo_diario: i.daily_usage,
          dias_restantes: i.days_until_stockout,
          ponto_pedido: i.reorder_point,
          status: i.status,
        }));
        filename = "relatorio_previsao";
        break;
    }

    toast.promise(
      Promise.resolve(exportToCSV(data, filename)),
      {
        loading: '🗂️ Gerando CSV...',
        success: `📈 ${filename}.csv exportado com sucesso!`,
        error: 'Erro ao exportar CSV',
      }
    );
  };

  const handleExportPDF = () => {
    let title = "Relatório";
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = "relatorio";

    switch (activeTab) {
      case "abc":
        title = "Relatório ABC";
        headers = ["Produto", "Classe", "Valor", "% Individual", "% Acumulado"];
        rows = abc.slice(0, 20).map((i) => [
          i.product_name,
          i.classification,
          `R$ ${i.value.toFixed(2)}`,
          `${i.percentage.toFixed(2)}%`,
          `${i.cumulative_percentage.toFixed(2)}%`,
        ]);
        filename = "relatorio_abc";
        break;
      case "xyz":
        title = "Relatório XYZ";
        headers = ["Produto", "Classe", "CV"];
        rows = xyz.slice(0, 20).map((i) => [i.product_name, i.classification, i.cv.toFixed(3)]);
        filename = "relatorio_xyz";
        break;
      case "turnover":
        title = "Relatório de Giro";
        headers = ["Produto", "Taxa de Giro", "Estoque Médio", "Total Vendido"];
        rows = turnover.slice(0, 20).map((i) => [
          i.product_name,
          i.turnover_rate.toFixed(2),
          i.avg_inventory.toFixed(1),
          i.total_sales.toString(),
        ]);
        filename = "relatorio_giro";
        break;
      case "forecast":
        title = "Relatório de Previsão";
        headers = ["Produto", "Consumo Diário", "Dias Restantes", "Ponto de Pedido", "Status"];
        rows = forecast.slice(0, 20).map((i) => [
          i.product_name,
          i.daily_usage.toFixed(2),
          i.days_until_stockout > 365 ? "> 1 ano" : `${i.days_until_stockout.toFixed(0)} dias`,
          i.reorder_point.toString(),
          i.status,
        ]);
        filename = "relatorio_previsao";
        break;
    }

    toast.promise(
      Promise.resolve(exportToPDF(title, headers, rows, filename)),
      {
        loading: '📝 Gerando PDF...',
        success: `📄 ${filename}.pdf exportado com sucesso!`,
        error: 'Erro ao exportar PDF',
      }
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando relatórios...</div>;
  }

  const emptyMsg = (
    <div className="py-8 text-center text-muted-foreground text-sm">
      Sem dados suficientes para este relatório. Cadastre produtos e movimentações para visualizar esta seção.
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Visão financeira e saúde do estoque</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <Select
              value={itemsPageSize === "all" ? "all" : itemsPageSize.toString()}
              onValueChange={(val) => setItemsPageSize(val === "all" ? "all" : parseInt(val))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Quantidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
                <SelectItem value="100">Top 100</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelpDialog(true)}
            className="h-9 w-9"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          {canExport("reports") && (
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
      </div>

      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guia de Relatórios</DialogTitle>
            <DialogDescription>
              Entenda os diferentes tipos de análise disponíveis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-auto">
            <div>
              <h4 className="font-semibold text-foreground mb-1">📊 Curva ABC</h4>
              <p className="text-sm text-muted-foreground">
                Classifica produtos por valor consumido. <strong>Classe A</strong> representa ~80% do valor com ~20% dos itens (foco máximo),
                <strong> Classe B</strong> ~15% do valor, e <strong>Classe C</strong> os demais. Use para priorizar compras e gestão.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">📈 Análise XYZ</h4>
              <p className="text-sm text-muted-foreground">
                Mede variabilidade da demanda. <strong>X</strong> = demanda estável (previsível),
                <strong> Y</strong> = demanda moderada, <strong>Z</strong> = demanda irregular (requer atenção extra).
                Produtos Z precisam de estoque de segurança maior.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">🔄 Giro de Estoque</h4>
              <p className="text-sm text-muted-foreground">
                Indica quantas vezes o estoque "gira" no período. <strong>Alto giro (&gt;4x)</strong> = produtos vendem rápido,
                <strong> Giro médio (2-4x)</strong> = rotatividade normal, <strong>Baixo giro (&lt;2x)</strong> = produtos parados (risco de obsolescência).
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">⚠️ Previsão de Estoque</h4>
              <p className="text-sm text-muted-foreground">
                Calcula quando produtos podem faltar. <strong>Crítico</strong> = menos de 7 dias,
                <strong> Alerta</strong> = 7-30 dias, <strong>OK</strong> = mais de 30 dias.
                O "Ponto de Pedido" indica quando encomendar mais unidades.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {financial && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Valor em Estoque"
            value={financial.total_inventory_value}
            prefix="R$"
            subtitle="Estoque total ao preço de venda."
          />
          <SummaryCard
            title="Custo Total"
            value={financial.total_cost_value}
            prefix="R$"
            subtitle="Custo de aquisição dos produtos em estoque."
          />
          <SummaryCard
            title="Lucro Potencial"
            value={financial.potential_profit}
            prefix="R$"
            subtitle="Diferença entre custo e preço de venda."
          />
          <SummaryCard
            title="Margem Média"
            value={financial.average_margin}
            suffix="%"
            subtitle="Margem Média ponderada dos produtos."
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="flex gap-2">
          <TabsTrigger
            value="abc"
            className="data-[state=active]:bg-muted data-[state=active]:font-medium data-[state=active]:text-foreground"
          >
            Curva ABC
          </TabsTrigger>
          <TabsTrigger
            value="xyz"
            className="data-[state=active]:bg-muted data-[state=active]:font-medium data-[state=active]:text-foreground"
          >
            Análise XYZ
          </TabsTrigger>
          <TabsTrigger
            value="turnover"
            className="data-[state=active]:bg-muted data-[state=active]:font-medium data-[state=active]:text-foreground"
          >
            Giro
          </TabsTrigger>
          <TabsTrigger
            value="forecast"
            className="data-[state=active]:bg-muted data-[state=active]:font-medium data-[state=active]:text-foreground"
          >
            Previsão
          </TabsTrigger>
        </TabsList>

        {/* ABA CURVA ABC */}
        <TabsContent value="abc" className="space-y-3">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-lg font-semibold">Distribuição ABC</h3>
              <p className="text-sm text-muted-foreground">Quantidade de produtos por classe</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4">
            {/* Tabela */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Curva ABC - Detalhada</CardTitle>
                <CardDescription>
                  Top itens por valor consumido. Use essa lista para focar no que mais impacta o faturamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {paginated.abc.length === 0 ? (
                  emptyMsg
                ) : (
                  <div className="max-h-[420px] overflow-auto border rounded-md">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow className="border-b">
                          <TableHead className="text-sm font-medium text-muted-foreground">Produto</TableHead>
                          <TableHead className="text-sm font-medium text-muted-foreground">Classe</TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">Valor</TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">% Individual</TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">% Acumulado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...paginated.abc]
                          .sort((a, b) => b.value - a.value)
                          .map((item, idx) => (
                            <TableRow
                              key={item.product_id}
                              className={`border-b ${idx % 2 === 1 ? "bg-muted/40" : ""}`}
                            >
                              <TableCell className="text-foreground">{item.product_name}</TableCell>
                              <TableCell>
                                <ClassBadge classification={item.classification} />
                              </TableCell>
                              <TableCell className="text-right text-foreground">R$ {item.value.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-foreground">{item.percentage.toFixed(2)}%</TableCell>
                              <TableCell className="text-right text-foreground">{item.cumulative_percentage.toFixed(2)}%</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card Visual ABC */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Resumo por Classe</CardTitle>
                <CardDescription>Participação no valor total</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-full h-[250px]">
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
                      <RechartsTooltip
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-2 mt-4">
                  {abcChartData.map((item) => (
                    <div key={item.name} className="flex justify-between text-sm border-b pb-1 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {item.count} itens ({((item.value / abcCounts.totalValue) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA ANÁLISE XYZ */}
        <TabsContent value="xyz" className="space-y-3">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-lg font-semibold">Demanda (XYZ)</h3>
              <p className="text-sm text-muted-foreground">Variabilidade da demanda por produto</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4">
            {/* Tabela */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Análise XYZ - Detalhada</CardTitle>
                <CardDescription>
                  Itens Z são mais instáveis e exigem mais atenção.
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["all", "X", "Y", "Z"].map((opt) => (
                    <Button
                      key={opt}
                      variant="outline"
                      size="sm"
                      className={xyzFilter === opt ? "bg-muted text-foreground font-medium" : ""}
                      onClick={() => setXyzFilter(opt as any)}
                    >
                      {opt === "all" ? "Todos" : opt}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {paginated.xyz.filter((item) => xyzFilter === "all" || item.classification === xyzFilter).length === 0 ? (
                  emptyMsg
                ) : (
                  <div className="max-h-[420px] overflow-auto border rounded-md">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow className="border-b">
                          <TableHead className="text-sm font-medium text-muted-foreground">Produto</TableHead>
                          <TableHead className="text-sm font-medium text-muted-foreground">Classe</TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">CV</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.xyz
                          .filter((item) => xyzFilter === "all" || item.classification === xyzFilter)
                          .sort((a, b) => b.cv - a.cv)
                          .map((item, idx) => (
                            <TableRow
                              key={item.product_id}
                              className={`border-b ${idx % 2 === 1 ? "bg-muted/40" : ""}`}
                            >
                              <TableCell className="text-foreground">{item.product_name}</TableCell>
                              <TableCell>
                                <ClassBadge classification={item.classification as any} />
                              </TableCell>
                              <TableCell className="text-right text-foreground">{item.cv.toFixed(3)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card Visual XYZ */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Distribuição XYZ</CardTitle>
                <CardDescription>Quantidade de produtos por classe</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={xyzChartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={30} />
                      <RechartsTooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {xyzChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-2 mt-4">
                  {xyzChartData.map((item) => (
                    <div key={item.name} className="flex justify-between text-sm border-b pb-1 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span>Produtos {item.name}</span>
                      </div>
                      <div className="text-muted-foreground font-medium">{item.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA GIRO */}
        <TabsContent value="turnover" className="space-y-3">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-lg font-semibold">Giro de Estoque</h3>
              <p className="text-sm text-muted-foreground">Relação entre vendas e estoque médio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4">
            {/* Tabela */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Giro Detalhado</CardTitle>
                <CardDescription>
                  Mostra o que está girando rápido e o que está parado.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="max-h-[420px] overflow-auto border rounded-md">
                  {paginated.turnover.length === 0 ? (
                    emptyMsg
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow className="border-b">
                          <TableHead className="text-sm font-medium text-muted-foreground">Produto</TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">Taxa de Giro</TableHead>
                          <TableHead className="text-sm font-medium text-muted-foreground">Categoria</TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">Estoque Médio</TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">Total Vendido</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...paginated.turnover]
                          .sort((a, b) => b.turnover_rate - a.turnover_rate)
                          .map((item, idx) => (
                            <TableRow
                              key={item.product_id}
                              className={`border-b ${idx % 2 === 1 ? "bg-muted/40" : ""}`}
                            >
                              <TableCell className="text-foreground">{item.product_name}</TableCell>
                              <TableCell className="text-right text-foreground">{item.turnover_rate.toFixed(2)}x</TableCell>
                              <TableCell>
                                <TurnoverBadge rate={item.turnover_rate} />
                              </TableCell>
                              <TableCell className="text-right text-foreground">{item.avg_inventory.toFixed(1)}</TableCell>
                              <TableCell className="text-right text-foreground">{item.total_sales}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card Visual Giro */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Top 5 Giro</CardTitle>
                <CardDescription>Produtos com maior rotatividade</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turnoverChartData} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                      <RechartsTooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'hsl(var(--foreground))', fontSize: 11, formatter: (val: any) => Number(val).toFixed(1) + 'x' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Top 5 produtos que mais giram no período atual.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA PREVISÃO */}
        <TabsContent value="forecast" className="space-y-3">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-lg font-semibold">Previsão de Estoque</h3>
              <p className="text-sm text-muted-foreground">Risco de ruptura e ponto de pedido</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)] gap-4">
            {/* Tabela */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Status de Estoque</CardTitle>
                <CardDescription>Veja o que vai faltar primeiro.</CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["all", "CRITICAL", "WARNING", "OK"].map((opt) => (
                    <Button
                      key={opt}
                      variant="outline"
                      size="sm"
                      className={forecastFilter === opt ? "bg-muted text-foreground font-medium" : ""}
                      onClick={() => setForecastFilter(opt as any)}
                    >
                      {opt === "all" ? "Todos" : opt === "CRITICAL" ? "Crítico" : opt === "WARNING" ? "Alerta" : "OK"}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 overflow-x-auto">
                <div className="max-h-[420px] overflow-auto border rounded-md">
                  {[...paginated.forecast]
                    .filter((item) => forecastFilter === "all" || item.status === forecastFilter).length === 0 ? (
                    emptyMsg
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow className="border-b">
                          <TableHead className="text-sm font-medium text-muted-foreground">Produto</TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-default text-foreground">Consumo Diário</TooltipTrigger>
                                <TooltipContent>Média de unidades consumidas por dia.</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-default text-foreground">Dias Restantes</TooltipTrigger>
                                <TooltipContent>Estimativa de quantos dias o estoque atual ainda dura.</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="text-right text-sm font-medium text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-default text-foreground">Ponto de Pedido</TooltipTrigger>
                                <TooltipContent>Quando o sistema recomenda gerar um novo pedido.</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          <TableHead className="text-center text-sm font-medium text-muted-foreground">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...paginated.forecast]
                          .filter((item) => forecastFilter === "all" || item.status === forecastFilter)
                          .sort((a, b) => a.days_until_stockout - b.days_until_stockout)
                          .map((item, idx) => (
                            <TableRow
                              key={item.product_id}
                              className={`${idx % 2 === 1 ? "bg-muted/40" : ""} ${item.status === "CRITICAL"
                                ? "bg-red-50 dark:bg-red-950/30"
                                : item.status === "WARNING"
                                  ? "bg-yellow-50 dark:bg-amber-900/30"
                                  : ""
                                }`}
                            >
                              <TableCell className="text-foreground">{item.product_name}</TableCell>
                              <TableCell className="text-right text-foreground">{item.daily_usage.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-foreground">
                                {item.days_until_stockout > 365
                                  ? "> 1 ano"
                                  : `${item.days_until_stockout.toFixed(0)} dias`}
                              </TableCell>
                              <TableCell className="text-right text-foreground">{item.reorder_point}</TableCell>
                              <TableCell className="text-center">
                                <StatusBadge status={item.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card Visual Previsão */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Resumo de Status</CardTitle>
                <CardDescription>Quantidade por nível de risco</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastChartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={50} />
                      <RechartsTooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {forecastChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-2 mt-4">
                  {forecastChartData.map((item) => (
                    <div key={item.name} className="flex justify-between text-sm border-b pb-1 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-muted-foreground font-medium">{item.count} produtos</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ title, value, prefix, suffix, subtitle }: { title: string; value: number; prefix?: string; suffix?: string; subtitle?: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {prefix} {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} {suffix}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: ForecastItem["status"] }) {
  if (status === "CRITICAL") return <Badge variant="destructive">Crítico</Badge>;
  if (status === "WARNING") return <Badge variant="secondary">Alerta</Badge>;
  return <Badge variant="default">OK</Badge>;
}

function ClassBadge({ classification }: { classification: ABCItem["classification"] }) {
  if (classification === "A") return <Badge variant="default">A</Badge>;
  if (classification === "B") return <Badge variant="secondary">B</Badge>;
  if (classification === "C") return <Badge variant="outline">C</Badge>;
  if (classification === "X") return <Badge variant="default">X</Badge>;
  if (classification === "Y") return <Badge variant="secondary">Y</Badge>;
  return <Badge variant="outline">Z</Badge>;
}

function TurnoverBadge({ rate }: { rate: number }) {
  if (rate >= 4) return <Badge variant="default">Giro Alto</Badge>;
  if (rate >= 2) return <Badge variant="secondary">Giro Médio</Badge>;
  return <Badge variant="destructive">Giro Baixo</Badge>;
}
