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
import type { Product, Category } from '@/types';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsData, categoriesData] = await Promise.all([
                productService.getAll(),
                categoryService.getAll(),
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async () => {
        try {
            const data = {
                name: formData.name,
                sku: formData.sku,
                price: parseFloat(formData.price),
                cost_price: parseFloat(formData.cost_price),
                quantity: parseInt(formData.quantity),
                alert_level: parseInt(formData.alert_level),
                lead_time: parseInt(formData.lead_time),
                category_id: parseInt(formData.category_id),
            };

            if (editingProduct) {
                await productService.update(editingProduct.id, data as any);
            } else {
                await productService.create(data as any);
            }
            await loadData();
            setDialogOpen(false);
            resetForm();
            toast.success(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            toast.error('Erro ao salvar produto');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            await productService.delete(id);
            await loadData();
            toast.success('Produto excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            toast.error('Erro ao excluir produto');
        }
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

    const resetForm = () => {
        setEditingProduct(null);
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
    };

    const getStockStatus = (product: Product) => {
        if (product.quantity === 0) return <Badge variant="destructive">Sem estoque</Badge>;
        if (product.quantity <= product.alert_level)
            return <Badge variant="outline" className="text-yellow-700 border-yellow-300">Baixo</Badge>;
        return <Badge variant="default" className="bg-green-600">OK</Badge>;
    };

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
                <Button onClick={() => openDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Produto
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome ou SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
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
                                    <TableCell colSpan={7} className="text-center text-slate-500">
                                        Nenhum produto encontrado
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openDialog(product)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(product.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
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
        </div>
    );
}
