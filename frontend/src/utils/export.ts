import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
            const val = row[h];
            // Handle strings with commas or quotes
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

export function exportToPDF(
    title: string,
    headers: string[],
    data: any[][],
    filename: string
) {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

    autoTable(doc, {
        head: [headers],
        body: data,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}
