/**
 * EXEMPLO: usePermissions em MovementsPage
 */

import { usePermissions } from '@/hooks/usePermissions';

export default function MovementsPage() {
    const { canCreate, canExport } = usePermissions();

    // Movimentos geralmente não tem edição/deleção individual
    // Apenas criação de novas movimentações
}

// ============================================
// Botão Nova Movimentação
// ============================================

{
    canCreate('movements') && (
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Movimentação
        </Button>
    )
}

// ============================================
// Botão Exportar
// ============================================

{
    canExport('movements') && (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            {/* ... */}
        </DropdownMenu>
    )
}

/**
 * EXEMPLO: usePermissions em UsersPage
 */

export default function UsersPage() {
    const { canCreate, canEdit, canDelete, isAdmin, hasPermission } = usePermissions();

    // Usuários é uma página mais sensível
}

// ============================================
// Botão Novo Usuário (só admin/owner)
// ============================================

{
    canCreate('users') && (
        <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Usuário
        </Button>
    )
}

// ============================================
// Botões de Ação na Tabela
// ============================================

<TableCell className="text-right">
    <div className="flex items-center justify-end gap-2">
        {canEdit('users') && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => openDialog(user)}
            >
                <Pencil className="w-4 h-4" />
            </Button>
        )}
        {canDelete('users') && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(user)}
                disabled={user.id === currentUser?.id} // Não pode deletar a si mesmo
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        )}
    </div>
</TableCell>

// ============================================
// Campo de Role (só admin pode alterar)
// ============================================

{
    hasPermission('users.manage_roles') && (
        <div>
            <Label>Role</Label>
            <Select value={formData.role_id} onValueChange={/* ... */}>
                {/* ... */}
            </Select>
        </div>
    )
}

/**
 * EXEMPLO: usePermissions na Sidebar (Layout.tsx)
 */

export default function Layout() {
    const { canView } = usePermissions();
}

// ============================================
// Links da Sidebar
// ============================================

{/* Sempre visível */ }
<NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
<NavLink to="/products" icon={Package}>Produtos</NavLink>
<NavLink to="/movements" icon={ArrowUpDown}>Movimentações</NavLink>
<NavLink to="/reports" icon={FileText}>Relatórios</NavLink>

{/* Só para quem pode ver usuários */ }
{
    canView('users') && (
        <NavLink to="/users" icon={Users}>Usuários</NavLink>
    )
}

{/* Só para quem pode ver auditoria */ }
{
    canView('audit') && (
        <NavLink to="/audit" icon={Shield}>Auditoria</NavLink>
    )
}

/**
 * RESUMO DE APLICAÇÃO
 * 
 * 1. ProductsPage: canCreate, canEdit, canDelete, canExport
 * 2. MovementsPage: canCreate, canExport
 * 3. CategoriesPage: canCreate, canEdit, canDelete (similar a Products)
 * 4. UsersPage: canCreate, canEdit, canDelete, hasPermission('users.manage_roles')
 * 5. Layout/Sidebar: canView('users'), canView('audit')
 * 
 * Tempo estimado: ~30 minutos para todas as páginas
 */
