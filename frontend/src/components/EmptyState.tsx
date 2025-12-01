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
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    variant = 'default',
    size = 'md',
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

    const sizeStyles = {
        sm: {
            container: 'py-8 px-4',
            iconWrapper: 'p-3 mb-3',
            icon: 'w-6 h-6',
            title: 'text-base mb-1',
            description: 'text-sm mb-4'
        },
        md: {
            container: 'py-16 px-4',
            iconWrapper: 'p-6 mb-4',
            icon: 'w-12 h-12',
            title: 'text-xl mb-2',
            description: 'text-base mb-6'
        },
        lg: {
            container: 'py-24 px-4',
            iconWrapper: 'p-8 mb-6',
            icon: 'w-16 h-16',
            title: 'text-2xl mb-3',
            description: 'text-lg mb-8'
        }
    };

    const currentSize = sizeStyles[size];

    return (
        <div className={cn(
            'flex flex-col items-center justify-center',
            currentSize.container,
            className
        )}>
            <div className={cn(
                'rounded-full',
                currentSize.iconWrapper,
                iconBgStyles[variant]
            )}>
                <Icon className={cn(currentSize.icon, variantStyles[variant])} />
            </div>

            <h3 className={cn("font-semibold text-slate-900 dark:text-slate-100", currentSize.title)}>
                {title}
            </h3>

            <p className={cn("text-slate-600 dark:text-slate-400 text-center max-w-sm", currentSize.description)}>
                {description}
            </p>

            {action && (
                <Button onClick={action.onClick} className="gap-2" size={size === 'sm' ? 'sm' : 'default'}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
