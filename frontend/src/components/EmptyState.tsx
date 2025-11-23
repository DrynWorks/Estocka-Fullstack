import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: 'default' | 'search' | 'error';
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    variant = 'default',
    className
}: EmptyStateProps) {
    const variantStyles = {
        default: 'text-slate-400',
        search: 'text-blue-400',
        error: 'text-red-400'
    };

    const iconBgStyles = {
        default: 'bg-slate-100 dark:bg-slate-800',
        search: 'bg-blue-50 dark:bg-blue-950',
        error: 'bg-red-50 dark:bg-red-950'
    };

    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-16 px-4',
            className
        )}>
            <div className={cn(
                'rounded-full p-6 mb-4',
                iconBgStyles[variant]
            )}>
                <Icon className={cn('w-12 h-12', variantStyles[variant])} />
            </div>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {title}
            </h3>

            <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm mb-6">
                {description}
            </p>

            {action && (
                <Button onClick={action.onClick} className="gap-2">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
