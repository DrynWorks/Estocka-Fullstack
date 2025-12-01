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
import { Plus, Search, Pencil, Trash2, AlertTriangle, Package, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { usePermissions } from '@/hooks/usePermissions';

export default function ProductsPage() {
    const { canCreate, canEdit, canDelete, canExport } = usePermissions();
    const [products, setProducts] = useState<Product[]>([]);
    // ... existing state ...

    // ... existing useEffect and loadData ...

    // ... existing filteredProducts ...

    // ... existing handleSave ...

    // ... existing openDeleteDialog ...

    // ... existing confirmDelete ...

    // ... existing handleExportPDF and handleExportCSV ...

    // ... existing openDialog ...

    // ... existing resetForm ...

    // ... existing getStockStatus ...

    if (loading) {
        return <div className="flex items-center justify-center h-64">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Produtos</h1>
                    <p className="text-slate-600 mt-1">Gerencie o catálogo de produtos</p>
                </div>
                <div className="flex gap-2">
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
                {/* ... existing CardHeader ... */}
                <CardContent>
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
                            {filteredProducts.length === 0 ? (
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
                                filteredProducts.map((product) => (
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
                </CardContent>
            </Card>

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
