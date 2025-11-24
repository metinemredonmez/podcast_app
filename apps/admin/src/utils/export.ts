/**
 * Export utilities for CSV, Excel, and PDF formats
 */

// CSV Export
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Use provided columns or infer from first object
  const exportColumns =
    columns ||
    Object.keys(data[0]).map((key) => ({
      key: key as keyof T,
      label: key,
    }));

  // Create CSV header
  const headers = exportColumns.map((col) => col.label).join(',');

  // Create CSV rows
  const rows = data.map((row) => {
    return exportColumns
      .map((col) => {
        const value = row[col.key];
        // Handle special characters and commas
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

// Excel Export (using CSV format - for proper Excel, use xlsx library)
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  // For now, using CSV format which Excel can open
  // For proper .xlsx format, install and use 'xlsx' library
  exportToCSV(data, filename, columns);
}

// JSON Export
export function exportToJSON<T>(data: T[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

// PDF Export (basic HTML to PDF - for advanced PDF, use jsPDF or pdfmake)
export async function exportToPDF(
  title: string,
  data: any[],
  columns: { key: string; label: string }[],
  filename: string
): Promise<void> {
  // Create HTML content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #5D87FF;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #5D87FF;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <table>
        <thead>
          <tr>
            ${columns.map((col) => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${columns.map((col) => `<td>${row[col.key] || ''}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        Generated on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  // For browser print to PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    console.error('Failed to open print window');
  }
}

// Helper function to download blob
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Export all data with formatting
export function exportWithFormatting<T extends Record<string, any>>(
  data: T[],
  format: 'csv' | 'excel' | 'json' | 'pdf',
  filename: string,
  options?: {
    columns?: { key: keyof T; label: string }[];
    title?: string;
  }
): void {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename, options?.columns);
      break;
    case 'excel':
      exportToExcel(data, filename, options?.columns);
      break;
    case 'json':
      exportToJSON(data, filename);
      break;
    case 'pdf':
      if (options?.columns && options?.title) {
        exportToPDF(
          options.title,
          data,
          options.columns.map((col) => ({ key: String(col.key), label: col.label })),
          filename
        );
      }
      break;
  }
}
