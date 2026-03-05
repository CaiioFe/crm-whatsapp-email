"use client";

/**
 * Utilitário para exportar dados como CSV
 * Uso: exportCSV(data, "leads.csv")
 */

type CSVData = Record<string, string | number | boolean | null | undefined>;

export function exportCSV(data: CSVData[], filename: string) {
    if (!data.length) return;

    const headers = Object.keys(data[0]);

    const csvRows = [
        headers.join(","),
        ...data.map((row) =>
            headers
                .map((h) => {
                    const val = row[h];
                    if (val === null || val === undefined) return "";
                    const str = String(val);
                    // Escape quotes and wrap in quotes if contains comma or newline
                    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                })
                .join(",")
        ),
    ];

    const csv = csvRows.join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
