import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  startDate?: string;
  endDate?: string;
  onDateChange?: (start: string, end: string) => void;
  onApply?: () => void;
}

export function PeriodSelector({ value, onChange, startDate, endDate, onDateChange, onApply }: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 w-fit">
      <div className="flex items-center gap-2 px-2">
        <Calendar className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Período:</span>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-950">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
          <SelectItem value="90d">Últimos 90 dias</SelectItem>
          <SelectItem value="365d">Último ano</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
      
      {value === 'custom' && (
        <div className="flex items-center gap-2 ml-2 animate-in fade-in slide-in-from-left-2">
          <Input 
            type="date" 
            value={startDate} 
            onChange={(e) => onDateChange?.(e.target.value, endDate || '')}
            className="w-auto h-9 bg-white dark:bg-slate-950"
          />
          <span className="text-sm text-slate-500">até</span>
          <Input 
            type="date" 
            value={endDate}
            onChange={(e) => onDateChange?.(startDate || '', e.target.value)}
            className="w-auto h-9 bg-white dark:bg-slate-950"
          />
          <Button size="sm" onClick={onApply} className="h-9">Aplicar</Button>
        </div>
      )}
    </div>
  );
}
