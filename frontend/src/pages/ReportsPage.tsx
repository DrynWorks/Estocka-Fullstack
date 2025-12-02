import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
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
    abc.forEach((item) => {
      counts[item.classification as "A" | "B" | "C"] += 1;
    });
    return counts;
  }, [abc]);

  const applyLimit = <T,>(items: T[]) => (itemsPageSize === "all" ? items : items.slice(0, itemsPageSize));

  const paginated = {
    abc: useMemo(() => applyLimit(abc), [abc, itemsPageSize]),
    xyz: useMemo(() => applyLimit(xyz), [xyz, itemsPageSize]),
    turnover: useMemo(() => applyLimit(turnover), [turnover, itemsPageSize]),
    forecast: useMemo(() => applyLimit(forecast), [forecast, itemsPageSize]),
  };

  const riskCounters = useMemo(() => {
    const critical = forecast.filter((f) => f.status === "CRITICAL").length;
    const warning = forecast.filter((f) => f.status === "WARNING").length;
    const ok = forecast.filter((f) => f.status === "OK").length;
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
    exportToCSV(data, "relatorio_abc");
  };

  const handleExportPDF = () => {
    const headers = ["Produto", "Classe", "Valor", "% Individual", "% Acumulado"];
    const rows = abc.slice(0, 20).map((i) => [
      i.product_name,
      i.classification,
      `R$ ${i.value.toFixed(2)}`,
      `${i.percentage.toFixed(2)}%`,
      `${i.cumulative_percentage.toFixed(2)}%`,
    ]);
    exportToPDF("Relatório ABC", headers, rows, "relatorio_abc");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando relatórios...</div>;
  }

  const emptyMsg = (
    <div className="py-8 text-center text-muted-foreground text-sm">
      Sem dados suficientes para este relatório.ório. Cadastre produtos e movimentações para visualizar esta seção.ção.
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Visão financeira e saúde do estoque</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="h-full">
          <CardHeader className="h-full flex flex-col justify-center">
            <CardTitle>Resumo ABC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 flex flex-col justify-center h-full">
            <div className="text-sm text-foreground">
              Classe A: {abcCounts.A} itens · Classe B: {abcCounts.B} itens · Classe C: {abcCounts.C} itens
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos A concentram a maior parte do valor do estoque.
            </p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="h-full flex flex-col justify-center">
            <CardTitle>Risco de ruptura</CardTitle>
            <CardDescription>Produtos por nível de risco de falta de estoque.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-center h-full">
            <Badge variant="destructive">Crítico: {riskCounters.critical}</Badge>
            <Badge variant="secondary">Alerta: {riskCounters.warning}</Badge>
            <Badge variant="default">OK: {riskCounters.ok}</Badge>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader className="h-full flex flex-col justify-center">
            <CardTitle>Itens exibidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 flex flex-col justify-center h-full">
            <div className="text-sm font-medium text-foreground">Itens exibidos:</div>
            <Select
              value={itemsPageSize === "all" ? "all" : itemsPageSize.toString()}
              onValueChange={(val) => setItemsPageSize(val === "all" ? "all" : parseInt(val))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Quantidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
                <SelectItem value="100">Top 100</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Defina quantos produtos quer visualizar nas tabelas abaixo.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="abc" className="space-y-3">
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
            PreVisão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abc" className="space-y-3">
          <Card className="space-y-2">
            <CardHeader>
              <CardTitle>Distribuição ABC</CardTitle>
              <CardDescription>Quantidade de produtos por classe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">A: {abcCounts.A}</Badge>
                <Badge variant="secondary">B: {abcCounts.B}</Badge>
                <Badge variant="outline">C: {abcCounts.C}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="space-y-2">
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
        </TabsContent>

        <TabsContent value="xyz" className="space-y-3">
          <Card className="space-y-2">
            <CardHeader>
              <CardTitle>Demanda (XYZ)</CardTitle>
              <CardDescription>
                Variabilidade da demanda por produto. Itens Z são mais instáveis e exigem mais atenção.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Card className="w-full sm:w-auto">
                  <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
                    <div>X: demanda estável (baixa variação)</div>
                    <div>Y: demanda moderada</div>
                    <div>Z: demanda instável (alta variação)</div>
                    <div>CV: coeficiente de variação da demanda</div>
                  </CardContent>
                </Card>
                <div className="flex flex-wrap gap-2">
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
              </div>
              <div className="overflow-x-auto">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover" className="space-y-3">
          <Card className="space-y-2">
            <CardHeader>
              <CardTitle>Giro de Estoque</CardTitle>
              <CardDescription>
                Relação entre vendas e estoque médio. Mostra o que está girando rápido e o que está parado.
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
        </TabsContent>

        <TabsContent value="forecast" className="space-y-3">
          <Card className="space-y-2">
            <CardHeader>
              <CardTitle>PreVisão de Estoque</CardTitle>
              <CardDescription>Risco de ruptura e ponto de pedido. Veja o que vai faltar primeiro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 overflow-x-auto">
              <div className="flex flex-wrap gap-2">
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
                            className={`${idx % 2 === 1 ? "bg-muted/40" : ""} ${
                              item.status === "CRITICAL"
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




