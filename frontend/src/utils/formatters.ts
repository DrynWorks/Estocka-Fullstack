/**
 * Formatting utilities for displaying values consistently across the application.
 * All formatters use Brazilian locale (pt-BR).
 */

/**
 * Format a number as Brazilian currency (BRL).
 * 
 * @param value - Number to format
 * @returns Formatted string like "R$ 1.234,56"
 * 
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(0) // "R$ 0,00"
 */
export function formatCurrency(value: number | string | null | undefined): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (numValue == null || isNaN(numValue)) {
        return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numValue);
}

/**
 * Format a number with thousands separator.
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string like "1.234" or "1.234,56"
 * 
 * @example
 * formatNumber(1234) // "1.234"
 * formatNumber(1234.56, 2) // "1.234,56"
 */
export function formatNumber(
    value: number | string | null | undefined,
    decimals: number = 0
): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (numValue == null || isNaN(numValue)) {
        return '0';
    }

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(numValue);
}

/**
 * Format a number as percentage.
 * 
 * @param value - Number to format (0-100 scale or 0-1 scale)
 * @param decimals - Number of decimal places (default: 1)
 * @param useDecimalScale - If true, treats value as 0-1 scale (default: false)
 * @returns Formatted string like "12,5%"
 * 
 * @example
 * formatPercent(12.5) // "12,5%"
 * formatPercent(0.125, 1, true) // "12,5%"
 */
export function formatPercent(
    value: number | string | null | undefined,
    decimals: number = 1,
    useDecimalScale: boolean = false
): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (numValue == null || isNaN(numValue)) {
        return '0%';
    }

    const percentValue = useDecimalScale ? numValue * 100 : numValue;

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(percentValue) + '%';
}

/**
 * Format a date string or Date object.
 * 
 * @param date - Date to format (ISO string or Date object)
 * @param format - Format type: 'short', 'medium', 'long' (default: 'short')
 * @returns Formatted date string
 * 
 * @example
 * formatDate('2024-11-25') // "25/11/2024"
 * formatDate('2024-11-25', 'medium') // "25 de nov. de 2024"
 * formatDate('2024-11-25', 'long') // "25 de novembro de 2024"
 */
export function formatDate(
    date: string | Date | null | undefined,
    format: 'short' | 'medium' | 'long' = 'short'
): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return '-';
    }

    const options: Intl.DateTimeFormatOptions = ({
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        medium: { day: '2-digit', month: 'short', year: 'numeric' },
        long: { day: '2-digit', month: 'long', year: 'numeric' },
    } as const)[format];

    return new Intl.DateTimeFormat('pt-BR', options).format(dateObj);
}

/**
 * Format a datetime string with time.
 * 
 * @param datetime - DateTime to format (ISO string or Date object)
 * @param includeSeconds - Include seconds (default: false)
 * @returns Formatted datetime string like "25/11/2024 14:30" or "25/11 14:30"
 * 
 * @example
 * formatDateTime('2024-11-25T14:30:00') // "25/11/2024 14:30"
 * formatDateTime('2024-11-25T14:30:45', true) // "25/11/2024 14:30:45"
 */
export function formatDateTime(
    datetime: string | Date | null | undefined,
    includeSeconds: boolean = false
): string {
    if (!datetime) return '-';

    const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;

    if (isNaN(dateObj.getTime())) {
        return '-';
    }

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds && { second: '2-digit' }),
    };

    return new Intl.DateTimeFormat('pt-BR', options).format(dateObj);
}

/**
 * Format a relative time (e.g., "há 2 dias", "em 3 horas").
 * 
 * @param date - Date to compare with now
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // "há 2 dias"
 * formatRelativeTime(new Date(Date.now() + 3 * 60 * 60 * 1000)) // "em 3 horas"
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return '-';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return '-';
    }

    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    const diff = dateObj.getTime() - Date.now();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (Math.abs(days) > 0) {
        return rtf.format(days, 'day');
    } else if (Math.abs(hours) > 0) {
        return rtf.format(hours, 'hour');
    } else if (Math.abs(minutes) > 0) {
        return rtf.format(minutes, 'minute');
    } else {
        return rtf.format(seconds, 'second');
    }
}

/**
 * Format file size in human-readable format.
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string like "1,5 MB"
 * 
 * @example
 * formatFileSize(1536) // "1,5 KB"
 * formatFileSize(1048576) // "1 MB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
    if (bytes == null || isNaN(bytes) || bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return formatNumber(bytes / Math.pow(k, i), i === 0 ? 0 : 1) + ' ' + sizes[i];
}
