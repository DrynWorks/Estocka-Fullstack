import { useEffect, useState } from 'react';
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
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export default function MovementsPage() {
    const [movements, setMovements] = useState<Movement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState<MovementCreate>({
        product_id: 0,
        type: 'entrada',
        quantity: 0,
        reason: '',
        note: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [movementsData, productsData] = await Promise.all([
                movementService.getAll(),
                productService.getAll(),
            ]);
            setMovements(movementsData);
            setProducts(productsData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await movementService.create(formData);
            await loadData();
            setDialogOpen(false);
            resetForm();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Erro ao registrar movimentação');
        }
    };

    const resetForm = () => {
        setFormData({
            product_id: 0,
            type: 'entrada',
            quantity: 0,
            reason: '',
            note: '',
        });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">Carregando...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Movimentações</h1>
                    <p className="text-slate-600 mt-1">Registre entradas e saídas de estoque</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Movimentação
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Movimentações</CardTitle>
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
                            {movements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500">
                                        Nenhuma movimentação registrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                movements.map((movement) => (
                                    <TableRow key={movement.id}>
                                        <TableCell className="font-mono text-sm">
                                            {new Date(movement.created_at).toLocaleString('pt-BR')}
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
                                        <TableCell className="font-medium">{movement.quantity}</TableCell>
                                        <TableCell>{movement.reason || '-'}</TableCell>
                                        <TableCell>{movement.created_by?.full_name || 'Sistema'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave}>Registrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
