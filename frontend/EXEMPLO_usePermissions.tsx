/**
 * EXEMPLO PRÁTICO: Como aplicar usePermissions em ProductsPage
 * 
 * Este arquivo mostra exatamente onde e como adicionar as verificações de permissão.
 * Copie e cole os trechos relevantes em ProductsPage.tsx
 */

import { usePermissions } from '@/hooks/usePermissions';

// ============================================
// PASSO 1: Adicionar o hook no componente
// ============================================

export default function ProductsPage() {
    // Adicione esta linha logo no início do componente, após os outros hooks
    const { canCreate, canEdit, canDelete, canExport } = usePermissions();

    // ... resto dos hooks (useState, etc)
}

// ============================================
// PASSO 2: Botão "Novo Produto"
// ============================================

// ANTES:
<Button onClick={() => openDialog()} className="gap-2">
    <Plus className="w-4 h-4" />
    Novo Produto
</Button>

// DEPOIS:
{
    canCreate('products') && (
        <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Produto
        </Button>
    )
}

// ============================================
// PASSO 3: Dropdown de Exportar
// ============================================

// ANTES:
<DropdownMenu>
    <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
        </Button>
    </DropdownMenuTrigger>
    {/* ... resto do dropdown */}
</DropdownMenu>

// DEPOIS:
{
    canExport('products') && (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar
                </Button>
            </DropdownMenuTrigger>
            {/* ... resto do dropdown */}
        </DropdownMenu>
    )
}

// ============================================
// PASSO 4: Botões de Editar e Deletar (na tabela)
// ============================================

// ANTES:
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
            onClick={() => openDeleteDialog(product)}
        >
            <Trash2 className="w-4 h-4" />
        </Button>
    </div>
</TableCell>

// DEPOIS:
<TableCell className="text-right">
    <div className="flex items-center justify-end gap-2">
        {canEdit('products') && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => openDialog(product)}
                aria-label="Editar produto"
            >
                <Pencil className="w-4 h-4" />
            </Button>
        )}
        {canDelete('products') && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(product)}
                aria-label="Deletar produto"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        )}
    </div>
</TableCell>

// ============================================
// EXEMPLO COMPLETO - Header da Página
// ============================================

// Procure por esta seção em ProductsPage.tsx (linha ~230):
<div className="flex items-center justify-between">
    <div>
        <h1 className="text-3xl font-bold text-slate-900">Produtos</h1>
        <p className="text-slate-600 mt-1">Gerencie o catálogo de produtos</p>
    </div>
    <div className="flex gap-2">
        {/* Botão Exportar - só mostra se pode exportar */}
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
        
        {/* Botão Novo - só mostra se pode criar */}
        {canCreate('products') && (
            <Button onClick={() => openDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Produto
            </Button>
        )}
    </div>
</div>

// ============================================
// RESUMO DAS PERMISSÕES POR ROLE
// ============================================

/*
OWNER:
  - canCreate('products') ✅
  - canEdit('products') ✅
  - canDelete('products') ✅
  - canExport('products') ✅

ADMIN:
  - canCreate('products') ✅
  - canEdit('products') ✅
  - canDelete('products') ✅
  - canExport('products') ✅

MANAGER:
  - canCreate('products') ✅
  - canEdit('products') ✅
  - canDelete('products') ✅
  - canExport('products') ✅

OPERATOR:
  - canCreate('products') ✅
  - canEdit('products') ✅
  - canDelete('products') ❌
  - canExport('products') ❌

VIEWER:
  - canCreate('products') ❌
  - canEdit('products') ❌
  - canDelete('products') ❌
  - canExport('products') ❌
*/

// ============================================
// TESTANDO PERMISSÕES
// ============================================

/*
1. Login como admin@estoque.com (role: admin)
   - Deve ver TODOS os botões

2. Crie um usuário com role "viewer"
   - Não deve ver botões de Criar, Editar, Deletar, Exportar
   - Só visualização

3. Crie um usuário com role "operator"
   - Deve ver Criar e Editar
   - NÃO deve ver Deletar e Exportar
*/
