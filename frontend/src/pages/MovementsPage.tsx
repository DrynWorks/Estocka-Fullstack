import { useEffect, useState } from 'react';
import { formatDateTime, formatNumber } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { movementService, type MovementCreate } from '@/services/movementService';
import { productService } from '@/services/productService';
import type { Movement, Product } from '@/types';
import { exportToPDF, exportToCSV } from '@/utils/export';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ArrowDownCircle, ArrowUpCircle, Search, Download, FileText, FileSpreadsheet, TrendingUp, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/TableSkeleton';
import { toast } from 'sonner';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import { usePermissions } from '@/hooks/usePermissions';

export default function MovementsPage() {
    const { canCreate, canExport } = usePermissions();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<MovementCreate>({
        product_id: 0,
        type: 'entrada',
        quantity: 0,
        reason: '',
        note: ''
    });

    const itemsPerPage = 10;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [movementsData, productsData] = await Promise.all([
                movementService.getMovements(),
                productService.getProducts()
            ]);
            setMovements(movementsData);
            setProducts(productsData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const filteredMovements = movements.filter((m) => {
        const matchesSearch = m.product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || m.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedMovements = filteredMovements.slice(startIndex, endIndex);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await movementService.createMovement(formData);
            toast.success('Movimentação registrada com sucesso!');
            setDialogOpen(false);
            resetForm();
            loadData();
        } catch (error: any) {
            console.error('Erro ao salvar movimentação:', error);
            const message = error?.response?.data?.detail || 'Erro ao salvar movimentação';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            product_id: 0,
            type: 'entrada',
            quantity: 0,
            reason: '',
            note: ''
        });
    };

    const handleExportPDF = () => {
        const headers = ['Data', 'Produto', 'Tipo', 'Qtd', 'Motivo', 'Usuário'];
        const data = filteredMovements.map(m => [
            formatDateTime(m.created_at),
            m.product.name,
            m.type === 'entrada' ? 'Entrada' : 'Saída',
            m.quantity.toString(),
            m.reason || '-',
            m.created_by?.full_name || 'Sistema'
        ]);
        exportToPDF('Relatório de Movimentações', headers, data, 'movimentacoes');
        toast.success('Relatório PDF exportado com sucesso!');
    };

    const handleExportCSV = () => {
        const data = filteredMovements.map(m => ({
            'Data': formatDateTime(m.created_at),
            'Produto': m.product.name,
            'Tipo': m.type === 'entrada' ? 'Entrada' : 'Saída',
            'Quantidade': m.quantity,
            'Motivo': m.reason || '-',
            'Usuário': m.created_by?.full_name || 'Sistema'
        }));
        exportToCSV(data, 'movimentacoes');
        toast.success('Relatório CSV exportado com sucesso!');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Movimentações</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Carregando...</p>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Movimentações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TableSkeleton rows={5} columns={6} />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Movimentações</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Registre entradas e saídas de estoque</p>
                </div>
                <div className="flex gap-2">
                    {canExport('movements') && (
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
                    )}
                    {canCreate('movements') && (
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Movimentação
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Movimentações</CardTitle>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por produto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os tipos</SelectItem>
                                <SelectItem value="entrada">Entrada</SelectItem>
                                <SelectItem value="saida">Saída</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Quantidade</TableHead>
                                <TableHead>Motivo</TableHead>
                                <TableHead>Usuário</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedMovements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-0">
                                        {movements.length === 0 ? (
                                            <EmptyState
                                                icon={TrendingUp}
                                                title="Nenhuma movimentação registrada"
                                                description="Registre entradas e saídas de estoque"
                                                action={{
                                                    label: "Nova Movimentação",
                                                    onClick: () => setDialogOpen(true)
                                                }}
                                            />
                                        ) : (
                                            <EmptyState
                                                icon={Search}
                                                title="Nenhuma movimentação encontrada"
                                                description="Ajuste os filtros de busca ou período"
                                                variant="search"
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedMovements.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell className="font-mono text-sm">
                                            {formatDateTime(movement.created_at)}
                                        </TableCell>
                                        <TableCell>{movement.product.name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={movement.type === 'entrada' ? 'default' : 'destructive'}
                                                className="flex items-center gap-1 w-fit"
                                            >
                                                {movement.type === 'entrada' ? (
                                                    <ArrowDownCircle className="w-3 h-3" />
                                                ) : (
                                                    <ArrowUpCircle className="w-3 h-3" />
                                                )}
                                                {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">{formatNumber(movement.quantity)}</TableCell>
                                        <TableCell>{movement.reason || '-'}</TableCell>
                                        <TableCell>{movement.created_by?.full_name || 'Sistema'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {filteredMovements.length > itemsPerPage && (
                        <div className="flex items-center justify-between px-2 py-4">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMovements.length)} de {filteredMovements.length} movimentações
                            </div>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5) {
                                            if (currentPage > 3) pageNum = currentPage - 2 + i;
                                            if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                                        }
                                        return (
                                            <PaginationItem key={pageNum}>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    isActive={currentPage === pageNum}
                                                    className="cursor-pointer"
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Movimentação</DialogTitle>
                        <DialogDescription>
                            Registre uma entrada ou saída de estoque
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="product">Produto</Label>
                            <Select
                                value={formData.product_id.toString()}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, product_id: parseInt(value) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um produto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name} - Estoque: {product.quantity}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: 'entrada' | 'saida') =>
                                    setFormData({ ...formData, type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">Entrada</SelectItem>
                                    <SelectItem value="saida">Saída</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantidade</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={formData.quantity || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Motivo</Label>
                            <Input
                                id="reason"
                                value={formData.reason || ''}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Ex: Compra, Venda, Ajuste..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="note">Observação (opcional)</Label>
                            <Input
                                id="note"
                                value={formData.note || ''}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Registrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
