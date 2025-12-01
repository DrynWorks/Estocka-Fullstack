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
import { userService, type User, type UserCreate } from '@/services/userService';
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
import { Plus, Search, Pencil, Trash2, Download, FileText, FileSpreadsheet, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/TableSkeleton';
import { usePermissions } from '@/hooks/usePermissions';

export default function UsersPage() {
    const { canCreate, canEdit, canDelete, canExport } = usePermissions();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<UserCreate>({
        full_name: '',
        email: '',
        password: '',
        role_id: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                userService.getUsers(),
                roleService.getRoles()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.full_name || !formData.email || !formData.role_id) {
                toast.error('Preencha todos os campos obrigatórios');
                return;
            }

            if (!editingUser && !formData.password) {
                toast.error('Senha é obrigatória para novos usuários');
                return;
            }

            setIsSaving(true);

            if (editingUser) {
                await userService.updateUser(editingUser.id, formData);
                toast.success('Usuário atualizado com sucesso');
            } else {
                await userService.createUser(formData);
                toast.success('Usuário criado com sucesso');
            }

            setDialogOpen(false);
            resetForm();
            loadData();
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            const message = error?.response?.data?.detail || 'Erro ao salvar usuário';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name,
            email: user.email,
            password: '', // Password is not returned by API
            role_id: user.role.id
        });
        setDialogOpen(true);
    };

    const handleDelete = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            setIsDeleting(true);
            await userService.deleteUser(userToDelete.id);
            toast.success('Usuário excluído com sucesso');
            setDeleteDialogOpen(false);
            loadData();
        } catch (error: any) {
            console.error('Erro ao excluir usuário:', error);
            const message = error?.response?.data?.detail || 'Erro ao excluir usuário';
            toast.error(message);
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            full_name: '',
            email: '',
            password: '',
            role_id: 0
        });
    };

    const handleExportPDF = () => {
        const headers = ['Nome', 'Email', 'Função'];
        const data = filteredUsers.map(user => [
            user.full_name,
            user.email,
            user.role.name
        ]);
        exportToPDF('Relatório de Usuários', headers, data, 'usuarios');
        toast.success('Relatório PDF exportado com sucesso!');
    };

    const handleExportCSV = () => {
        const data = filteredUsers.map(user => ({
            'Nome': user.full_name,
            'Email': user.email,
            'Função': user.role.name
        }));
        exportToCSV(data, 'usuarios');
        toast.success('Relatório CSV exportado com sucesso!');
    };

    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Usuários</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Gerencie o acesso ao sistema</p>
                </div>
                <div className="flex gap-2">
                    {canExport('users') && (
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
                    {canCreate('users') && (
                        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Usuário
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Usuários</CardTitle>
                    <CardDescription>
                        Total de {users.length} usuários cadastrados
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por nome ou email..."
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
                                                icon={UserIcon}
                                                title="Nenhum usuário cadastrado"
                                                description="Comece adicionando usuários ao sistema"
                                                action={canCreate('users') ? {
                                                    label: "Adicionar Usuário",
                                                    onClick: () => { resetForm(); setDialogOpen(true); }
                                                } : undefined}
                                            />
                                        ) : (
                                            <EmptyState
                                                icon={Search}
                                                title="Nenhum usuário encontrado"
                                                description="Tente buscar com outros termos"
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
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role.name === 'admin'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                                }`}>
                                                {user.role.name === 'admin' ? 'Administrador' : 'Usuário'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {canEdit('users') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Pencil className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                                                    </Button>
                                                )}
                                                {canDelete('users') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(user)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-600" />
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
                                    <SelectValue placeholder="Selecione uma função" />
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
