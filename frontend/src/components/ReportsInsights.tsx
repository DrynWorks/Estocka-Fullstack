import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InsightCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    description: string;
    variant?: 'info' | 'success' | 'warning' | 'danger';
    className?: string;
}

export function InsightCard({ icon, title, value, description, variant = 'info', className }: InsightCardProps) {
    const variants = {
        info: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
        success: 'border-green-200 bg-green-50 dark:bg-green-950/20',
        warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
        danger: 'border-red-200 bg-red-50 dark:bg-red-950/20',
    };

    return (
        <Card className={cn(variants[variant], className)}>
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                        {icon}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
                        <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{value}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{description}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
