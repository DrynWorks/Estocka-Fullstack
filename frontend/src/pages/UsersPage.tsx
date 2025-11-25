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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { exportToPDF, exportToCSV } from '@/utils/export';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, Pencil, Trash2, Users, Search, Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role.name === roleFilter;
        return matchesSearch && matchesRole;
    });

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
            setIsSaving(true);
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
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            const message = error?.response?.data?.detail || 'Erro ao salvar usuário';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteDialog = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            setIsDeleting(true);
            await userService.deleteUser(userToDelete.id);
            toast.success(`Usuário "${userToDelete.full_name}" excluído com sucesso!`);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            loadUsers();
        } catch (error: any) {
            console.error('Erro ao deletar usuário:', error);
            const message = error?.response?.data?.detail || 'Erro ao excluir usuário';
            toast.error(message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportPDF = () => {
        const headers = ['Nome', 'Email', 'Função'];
        const data = filteredUsers.map(u => [
            u.full_name,
            u.email,
            u.role.name === 'admin' ? 'Administrador' : 'Usuário'
        ]);
        exportToPDF('Relatório de Usuários', headers, data, 'usuarios');
        toast.success('Relatório PDF exportado com sucesso!');
    };

    const handleExportCSV = () => {
        const data = filteredUsers.map(u => ({
            'Nome': u.full_name,
            'Email': u.email,
            'Função': u.role.name === 'admin' ? 'Administrador' : 'Usuário'
        }));
        exportToCSV(data, 'usuarios');
        toast.success('Relatório CSV exportado com sucesso!');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Usuários</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Carregando...</p>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciamento de Usuários</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TableSkeleton rows={5} columns={4} />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-slate-100">Gerenciamento de Usuários</h1>
                    <p className="text-muted-foreground dark:text-slate-400 mt-1">
                        Gerencie usuários e permissões do sistema
                    </p>
                </div>

                <div className="flex gap-2">
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
                    <Button onClick={() => handleOpenDialog()} className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Novo Usuário
                    </Button>
                </div>
            </div >

            {/* Users Table */}
            < Card >
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Usuários Cadastrados
                    </CardTitle>
                    <CardDescription>
                        Total de {filteredUsers.length} usuários encontrados
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Função" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as funções</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="user">Usuário</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-0">
                                        {users.length === 0 ? (
                                            <EmptyState
                                                icon={Users}
                                                title="Nenhum usuário cadastrado"
                                                description="Adicione usuários para gerenciar acessos"
                                                action={{
                                                    label: "Adicionar Usuário",
                                                    onClick: () => handleOpenDialog()
                                                }}
                                            />
                                        ) : (
                                            <EmptyState
                                                icon={Search}
                                                title="Nenhum usuário encontrado"
                                                description="Tente outro termo de busca ou função"
                                                variant="search"
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
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
                                                    onClick={() => openDeleteDialog(user)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card >

            {/* Create/Edit Dialog */}
            < Dialog open={dialogOpen} onOpenChange={setDialogOpen} >
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
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingUser ? 'Atualizar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário{' '}
                            <span className="font-semibold">{userToDelete?.full_name}</span>?
                            <br />
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
