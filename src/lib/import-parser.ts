// ============================================================
// CRM WhatsApp & Email — File Parser Utility
// US 01.2 — Parse CSV, Excel e Paste data
// ============================================================

import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedData {
    headers: string[];
    rows: Record<string, string>[];
    totalRows: number;
}

/**
 * Parse CSV file content
 */
export function parseCSV(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: (results) => {
                const headers = results.meta.fields || [];
                const rows = results.data as Record<string, string>[];
                resolve({
                    headers,
                    rows,
                    totalRows: rows.length,
                });
            },
            error: (error) => {
                reject(new Error(`Erro ao processar CSV: ${error.message}`));
            },
        });
    });
}

/**
 * Parse Excel file (.xlsx, .xls)
 */
export function parseExcel(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
                    defval: "",
                    raw: false,
                });

                if (json.length === 0) {
                    resolve({ headers: [], rows: [], totalRows: 0 });
                    return;
                }

                const headers = Object.keys(json[0]);
                resolve({
                    headers,
                    rows: json,
                    totalRows: json.length,
                });
            } catch {
                reject(new Error("Erro ao processar Excel. Verifique se o arquivo é válido."));
            }
        };
        reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse pasted text data (tab-separated, comma-separated, or semicolon-separated)
 */
export function parsePastedData(text: string): ParsedData {
    if (!text.trim()) {
        return { headers: [], rows: [], totalRows: 0 };
    }

    // Detect separator
    const firstLine = text.trim().split("\n")[0];
    let separator = "\t"; // default: tab (most common from spreadsheets)
    if (!firstLine.includes("\t")) {
        if (firstLine.includes(";")) separator = ";";
        else if (firstLine.includes(",")) separator = ",";
    }

    const result = Papa.parse(text.trim(), {
        header: true,
        skipEmptyLines: true,
        delimiter: separator,
    });

    const headers = result.meta.fields || [];
    const rows = result.data as Record<string, string>[];

    return {
        headers,
        rows,
        totalRows: rows.length,
    };
}

/**
 * Parse any supported file type
 */
export async function parseFile(file: File): Promise<ParsedData> {
    const extension = file.name.split(".").pop()?.toLowerCase();

    switch (extension) {
        case "csv":
            return parseCSV(file);
        case "xlsx":
        case "xls":
            return parseExcel(file);
        default:
            throw new Error(`Formato de arquivo não suportado: .${extension}. Use CSV ou Excel.`);
    }
}

/**
 * Lead field definitions for column mapping
 */
export const LEAD_FIELDS = [
    { key: "name", label: "Nome", required: true },
    { key: "email", label: "Email", required: false },
    { key: "phone", label: "Telefone", required: false },
    { key: "company", label: "Empresa", required: false },
    { key: "position_title", label: "Cargo", required: false },
    { key: "source", label: "Origem", required: false },
] as const;

export type LeadFieldKey = (typeof LEAD_FIELDS)[number]["key"] | `custom:${string}` | "";

/**
 * Auto-detect column mapping based on header names
 */
export function autoDetectMapping(
    headers: string[]
): Record<string, LeadFieldKey> {
    const mapping: Record<string, LeadFieldKey> = {};

    const patterns: Record<string, RegExp> = {
        name: /^(nome|name|full.?name|nome.?completo|contato)$/i,
        email: /^(email|e-mail|e.mail|correo|mail)$/i,
        phone: /^(phone|telefone|tel|celular|whatsapp|mobile|fone)$/i,
        company: /^(company|empresa|companhia|organiz|org)$/i,
        position_title: /^(position|cargo|título|title|job|função|role)$/i,
        source: /^(source|origem|canal|fonte|origin)$/i,
    };

    for (const header of headers) {
        mapping[header] = ""; // default: unmapped
        let matched = false;
        for (const [field, pattern] of Object.entries(patterns)) {
            if (pattern.test(header.trim())) {
                mapping[header] = field as LeadFieldKey;
                matched = true;
                break;
            }
        }
        if (!matched && !!header.trim()) {
            // Auto map as custom field if it has a header name
            mapping[header] = `custom:${header.trim()}`;
        }
    }

    return mapping;
}

/**
 * Validate a lead row
 */
export function validateLeadRow(
    row: Record<string, string>,
    mapping: Record<string, string>,
    rowIndex: number
): { valid: boolean; errors: { row: number; field: string; message: string }[] } {
    const errors: { row: number; field: string; message: string }[] = [];

    // Get mapped values
    const mappedValues: Record<string, string> = {};
    for (const [csvCol, leadField] of Object.entries(mapping)) {
        if (leadField && row[csvCol]) {
            mappedValues[leadField] = row[csvCol].trim();
        }
    }

    // Name is required
    if (!mappedValues.name) {
        errors.push({ row: rowIndex, field: "name", message: "Nome é obrigatório" });
    }

    // Email format validation
    if (mappedValues.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(mappedValues.email)) {
            errors.push({ row: rowIndex, field: "email", message: `Email inválido: ${mappedValues.email}` });
        }
    }

    // Phone format (basic — digits, spaces, +, -, (, ))
    if (mappedValues.phone) {
        const cleanPhone = mappedValues.phone.replace(/[\s\-\(\)\+\.]/g, "");
        if (cleanPhone.length < 8 || !/^\d+$/.test(cleanPhone)) {
            errors.push({ row: rowIndex, field: "phone", message: `Telefone inválido: ${mappedValues.phone}` });
        }
    }

    return { valid: errors.length === 0, errors };
}
