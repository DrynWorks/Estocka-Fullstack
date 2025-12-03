import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { exportToPDF, exportToCSV } from '@/utils/export';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product, Category } from '@/types';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    AlertTriangle,
    Package,
    Download,
    FileText,
    FileSpreadsheet,
    LayoutGrid,
    List,
    Tag,
    Layers,
} from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

export default function ProductsPage() {
    const { canCreate, canEdit, canDelete, canExport } = usePermissions();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [search, setSearch] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');
    const [priceMin, setPriceMin] = useState<string>('');
    const [priceMax, setPriceMax] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(12);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        cost_price: '',
        quantity: '',
        alert_level: '',
        lead_time: '',
        category_id: '',
    });

    const loadData = async () => {
        setLoading(true);
        try {
            // Load categories only once if empty
            if (categories.length === 0) {
                const cats = await categoryService.getAll();
                setCategories(cats);
            }

            // Build filter params
            const params: any = {};
            if (search) params.search = search;
            if (categoryFilter !== 'all') params.category_id = Number(categoryFilter);
            if (stockFilter !== 'all') params.stock_status = stockFilter;
            if (priceMin) params.price_min = Number(priceMin);
            if (priceMax) params.price_max = Number(priceMax);

            // Fetch filtered products from backend
            const prods = await productService.search(params);
            setProducts(prods);
            setCurrentPage(1);
        } catch (error) {
            console.error('Erro ao carregar dados', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    // Reload when filters change (debounced for text search)
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, categoryFilter, stockFilter, priceMin, priceMax]);

    const resetForm = () => {
        setFormData({
            name: '',
            sku: '',
            price: '',
            cost_price: '',
            quantity: '',
            alert_level: '',
            lead_time: '',
            category_id: '',
        });
        setEditingProduct(null);
    };

    const openDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                sku: product.sku,
                price: product.price.toString(),
                cost_price: product.cost_price.toString(),
                quantity: product.quantity.toString(),
                alert_level: product.alert_level.toString(),
                lead_time: product.lead_time.toString(),
                category_id: product.category.id.toString(),
            });
        } else {
            resetForm();
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        const payload: any = {
            name: formData.name,
            sku: formData.sku,
            price: Number(formData.price),
            cost_price: Number(formData.cost_price),
            quantity: Number(formData.quantity),
            alert_level: Number(formData.alert_level),
            lead_time: Number(formData.lead_time),
            category_id: Number(formData.category_id),
        };

        try {
            if (editingProduct) {
                await productService.update(editingProduct.id, payload);
            } else {
                await productService.create(payload as any);
            }
            await loadData();
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar produto', error);
        }
    };

    const openDeleteDialog = (product: Product) => {
        setProductToDelete(product);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await productService.delete(productToDelete.id);
            await loadData();
        } catch (error) {
            console.error('Erro ao excluir produto', error);
        } finally {
            setDeleteDialogOpen(false);
            setProductToDelete(null);
        }
    };

    // Client-side pagination only (since backend returns all filtered results for now)
    const filteredProducts = products; // Products are already filtered by backend

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
    const page = Math.min(currentPage, totalPages);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const getStockStatus = (product: Product) => {
        if (product.quantity === 0) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" /> Sem estoque
                </Badge>
            );
        }
        if (product.quantity <= product.alert_level) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <AlertTriangle className="w-3 h-3" /> Baixo
                </Badge>
            );
        }
        return <Badge variant="default">OK</Badge>;
    };

    const handleExportPDF = () => {
        const headers = ['Nome', 'SKU', 'Categoria', 'Preço', 'Qtd', 'Alerta'];
        const data = filteredProducts.map((p) => [
            p.name,
            p.sku,
            p.category.name,
            `R$ ${p.price.toFixed(2)}`,
            p.quantity,
            p.alert_level,
        ]);
        exportToPDF('Produtos', headers, data, 'produtos');
    };

    const handleExportCSV = () => {
        const data = filteredProducts.map((p) => ({
            name: p.name,
            sku: p.sku,
            category: p.category.name,
            price: p.price,
            quantity: p.quantity,
            alert_level: p.alert_level,
        }));
        exportToCSV(data, 'produtos');
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Carregando...</div>;
    }

    const renderTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedProducts.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="p-0">
                            {products.length === 0 ? (
                                <EmptyState
                                    icon={Package}
                                    title="Nenhum produto cadastrado"
                                    description="Comece adicionando seu primeiro produto ao estoque"
                                    action={canCreate('products') ? {
                                        label: "Novo Produto",
                                        onClick: () => openDialog()
                                    } : undefined}
                                />
                            ) : (
                                <EmptyState
                                    icon={Search}
                                    title="Nenhum produto encontrado"
                                    description="Tente ajustar os filtros ou termo de busca"
                                    variant="search"
                                />
                            )}
                        </TableCell>
                    </TableRow>
                ) : (
                    paginatedProducts.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                            <TableCell>{product.category.name}</TableCell>
                            <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                            <TableCell>{product.quantity} un.</TableCell>
                            <TableCell>{getStockStatus(product)}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {canEdit('products') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDialog(product)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {canDelete('products') && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDeleteDialog(product)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    const renderGrid = () => (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedProducts.map((product) => (
                <Card key={product.id} className="h-full">
                    <CardHeader className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                                <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                            </div>
                            {getStockStatus(product)}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            <span>{product.category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            <span>Estoque: <strong className="text-foreground">{product.quantity}</strong> un.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">R$ {product.price.toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">Custo: R$ {product.cost_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            {canEdit('products') && (
                                <Button variant="outline" size="icon" onClick={() => openDialog(product)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            )}
                            {canDelete('products') && (
                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(product)}>
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
            {paginatedProducts.length === 0 && (
                <div className="sm:col-span-2 xl:col-span-3">
                    {products.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="Nenhum produto cadastrado"
                            description="Comece adicionando seu primeiro produto ao estoque"
                            action={canCreate('products') ? {
                                label: "Novo Produto",
                                onClick: () => openDialog()
                            } : undefined}
                        />
                    ) : (
                        <EmptyState
                            icon={Search}
                            title="Nenhum produto encontrado"
                            description="Tente ajustar os filtros ou termo de busca"
                            variant="search"
                        />
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
                    <p className="text-muted-foreground mt-1">Gerencie o catálogo de produtos</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                    <div className="flex rounded-md border border-muted bg-background">
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('list')}
                            aria-label="Ver em lista"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            aria-label="Ver em grade"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                    </div>
                    {canExport('products') && (
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
                    {canCreate('products') && (
                        <Button onClick={() => openDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Produto
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 gap-2">
                            <Input
                                placeholder="Buscar por nome ou SKU"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Select
                                value={categoryFilter}
                                onValueChange={(val) => setCategoryFilter(val)}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={stockFilter}
                                onValueChange={(val) => setStockFilter(val as any)}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Estoque" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="out">Zerado</SelectItem>
                                    <SelectItem value="low">Baixo</SelectItem>
                                    <SelectItem value="ok">Saudável</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Input
                                placeholder="Min R$"
                                type="number"
                                className="w-24"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                placeholder="Max R$"
                                type="number"
                                className="w-24"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={itemsPerPage === filteredProducts.length ? 'all' : itemsPerPage.toString()}
                                onValueChange={(val) => {
                                    const num = val === 'all' ? Math.max(filteredProducts.length, 1) : parseInt(val);
                                    setItemsPerPage(num);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Itens por página" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="12">12 por página</SelectItem>
                                    <SelectItem value="25">25 por página</SelectItem>
                                    <SelectItem value="50">50 por página</SelectItem>
                                    <SelectItem value="all">Todos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {viewMode === 'list' ? renderTable() : renderGrid()}
                </CardContent>
            </Card>

            {filteredProducts.length > itemsPerPage && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} produtos
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5) {
                                    if (page > 3) pageNum = page - 2 + i;
                                    if (page > totalPages - 2) pageNum = totalPages - 4 + i;
                                }
                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            onClick={() => setCurrentPage(pageNum)}
                                            isActive={page === pageNum}
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
                                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                        </DialogTitle>
                        <DialogDescription>
                            Preencha os dados do produto abaixo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                                id="sku"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantidade</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Preço de Venda</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost_price">Preço de Custo</Label>
                            <Input
                                id="cost_price"
                                type="number"
                                step="0.01"
                                value={formData.cost_price}
                                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alert_level">Nível de Alerta</Label>
                            <Input
                                id="alert_level"
                                type="number"
                                value={formData.alert_level}
                                onChange={(e) => setFormData({ ...formData, alert_level: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lead_time">Prazo de Entrega (dias)</Label>
                            <Input
                                id="lead_time"
                                type="number"
                                value={formData.lead_time}
                                onChange={(e) => setFormData({ ...formData, lead_time: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o produto{' '}
                            <span className="font-semibold">{productToDelete?.name}</span>?
                            <br />
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
