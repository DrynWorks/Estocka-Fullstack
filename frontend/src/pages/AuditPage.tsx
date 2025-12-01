import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { auditService } from '@/services/auditService';
import type { AuditLog } from '@/types';
import { FileText, Package, TrendingUp, Users } from 'lucide-react';
import { TableSkeleton } from '@/components/TableSkeleton';
import { EmptyState } from '@/components/EmptyState';

import { usePermissions } from '@/hooks/usePermissions';

export default function AuditPage() {
    const { canView } = usePermissions();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    if (!canView('audit')) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Acesso Negado</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-md">
                    Você não tem permissão para visualizar os logs de auditoria.
                    Entre em contato com o administrador se acreditar que isso é um erro.
                </p>
            </div>
        );
    }

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const data = await auditService.getLogs({ limit: 100 });
            setLogs(data);
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'create':
                return <Badge variant="default" className="bg-green-600">Criado</Badge>;
            case 'update':
                return <Badge variant="default" className="bg-blue-600">Editado</Badge>;
            case 'delete':
                return <Badge variant="destructive">Excluído</Badge>;
            default:
                return <Badge variant="outline">{action}</Badge>;
        }
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case 'product':
                return <Package className="w-4 h-4" />;
            case 'movement':
                return <TrendingUp className="w-4 h-4" />;
            case 'user':
                return <Users className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    const getEntityLabel = (entityType: string) => {
        const labels: Record<string, string> = {
            product: 'Produto',
            movement: 'Movimentação',
            category: 'Categoria',
            user: 'Usuário',
        };
        return labels[entityType] || entityType;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Auditoria</h1>
                    <p className="text-slate-600 mt-1">Carregando...</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Log de Auditoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TableSkeleton rows={10} columns={5} />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Auditoria</h1>
                <p className="text-slate-600 mt-1">
                    Histórico de ações realizadas no sistema
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Log de Auditoria ({logs.length} registros)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-0">
                                        <EmptyState
                                            icon={FileText}
                                            title="Nenhum log de auditoria"
                                            description="Ainda não há atividades registradas no sistema"
                                            size="md"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-mono text-sm">
                                            {formatDate(log.created_at)}
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getEntityIcon(log.entity_type)}
                                                <span>{getEntityLabel(log.entity_type)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            #{log.entity_id || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {log.details && (
                                                <div className="text-sm text-slate-600">
                                                    {log.details.name && <div><strong>Nome:</strong> {log.details.name}</div>}
                                                    {log.details.sku && <div><strong>SKU:</strong> {log.details.sku}</div>}
                                                    {log.details.type && <div><strong>Tipo:</strong> {log.details.type}</div>}
                                                    {log.details.quantity && <div><strong>Qtd:</strong> {log.details.quantity}</div>}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
