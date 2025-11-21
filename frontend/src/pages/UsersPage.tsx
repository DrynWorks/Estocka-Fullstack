import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { userService, type User, type UserCreate, type UserUpdate } from '@/services/userService';
import { roleService, type Role } from '@/services/roleService';
import { UserPlus, Pencil, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserCreate>({
        email: '',
        password: '',
        full_name: '',
        role_id: 2, // default to regular user
    });

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
        try {
            const data = await roleService.getRoles();
            setRoles(data);
        } catch (error) {
            console.error('Erro ao carregar roles:', error);
        }
    };

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                password: '', // don't populate password when editing
                full_name: user.full_name,
                role_id: user.role.id,
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                password: '',
                full_name: '',
                role_id: 2,
            });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingUser) {
                // Update user - only send fields that are filled
                const updateData: UserUpdate = {
                    email: formData.email,
                    full_name: formData.full_name,
                    role_id: formData.role_id,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await userService.updateUser(editingUser.id, updateData);
                toast.success('Usuário atualizado com sucesso!');
            } else {
                // Create new user
                await userService.createUser(formData);
                toast.success('Usuário criado com sucesso!');
            }
            setDialogOpen(false);
            loadUsers();
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            toast.error('Erro ao salvar usuário');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            await userService.deleteUser(id);
            toast.success('Usuário excluído com sucesso!');
            loadUsers();
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            toast.error('Erro ao excluir usuário');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-lg">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie usuários e permissões do sistema
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Novo Usuário
                </Button>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Usuários Cadastrados
                    </CardTitle>
                    <CardDescription>
                        Total de {users.length} usuários no sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role.name === 'admin' ? 'default' : 'secondary'}>
                                            {user.role.name === 'admin' ? 'Administrador' : 'Usuário'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(user)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingUser
                                ? 'Atualize as informações do usuário'
                                : 'Preencha os dados do novo usuário'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Nome Completo</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, full_name: e.target.value })
                                }
                                placeholder="João Silva"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                placeholder="joao@exemplo.com"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                Senha {editingUser && '(deixe em branco para manter a atual)'}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                                placeholder={editingUser ? 'Nova senha (opcional)' : 'Senha'}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role">Função</Label>
                            <Select
                                value={formData.role_id.toString()}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, role_id: parseInt(value) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name === 'admin' ? 'Administrador' : 'Usuário'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave}>
                            {editingUser ? 'Atualizar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
