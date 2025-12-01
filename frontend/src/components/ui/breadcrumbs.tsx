import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
    className?: string;
}

const routeNameMap: Record<string, string> = {
    'products': 'Produtos',
    'categories': 'Categorias',
    'movements': 'Movimentações',
    'users': 'Usuários',
    'audit': 'Auditoria',
    'reports': 'Relatórios',
    'dashboard': 'Dashboard',
    'settings': 'Configurações'
};

export function Breadcrumbs({ className }: BreadcrumbsProps) {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-slate-500 dark:text-slate-400", className)}>
            <ol className="flex items-center space-x-2">
                <li>
                    <Link
                        to="/"
                        className="flex items-center hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    const name = routeNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

                    return (
                        <li key={to} className="flex items-center space-x-2">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                            {isLast ? (
                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {name}
                                </span>
                            ) : (
                                <Link
                                    to={to}
                                    className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                >
                                    {name}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
