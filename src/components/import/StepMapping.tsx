"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, Columns } from "lucide-react";
import { LEAD_FIELDS, type ParsedData, type LeadFieldKey } from "@/lib/import-parser";

interface StepMappingProps {
    parsedData: ParsedData;
    initialMapping: Record<string, string>;
    onConfirm: (mapping: Record<string, string>) => void;
    onBack: () => void;
}

export function StepMapping({ parsedData, initialMapping, onConfirm, onBack }: StepMappingProps) {
    const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

    // Check which lead fields are already mapped
    const mappedFields = useMemo(() => {
        return new Set(Object.values(mapping).filter(Boolean));
    }, [mapping]);

    // Validate: at least "name" must be mapped
    const isValid = useMemo(() => {
        return Object.values(mapping).includes("name");
    }, [mapping]);

    const handleMappingChange = (csvColumn: string, leadField: string) => {
        setMapping((prev) => ({ ...prev, [csvColumn]: leadField }));
    };

    // Preview data: first 5 rows
    const previewRows = parsedData.rows.slice(0, 5);

    return (
        <div className="animate-slide-in">
            <div className="flex items-center gap-3 mb-6">
                <Columns size={20} style={{ color: "var(--brand-primary)" }} />
                <div>
                    <h2 className="text-lg font-semibold">Mapear Colunas</h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        Associe as colunas do seu arquivo aos campos do CRM.{" "}
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                            {parsedData.totalRows.toLocaleString()} linhas
                        </span>{" "}
                        encontradas.
                    </p>
                </div>
            </div>

            {/* Mapping table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                            <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-secondary)" }}>
                                Coluna do Arquivo
                            </th>
                            <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-secondary)" }}>
                                →
                            </th>
                            <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-secondary)" }}>
                                Campo do CRM
                            </th>
                            <th className="text-left py-3 px-4 font-semibold" style={{ color: "var(--text-secondary)" }}>
                                Amostra
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {parsedData.headers.map((header) => {
                            const currentMapping = mapping[header] || "";
                            const sampleValues = previewRows
                                .map((row) => row[header])
                                .filter(Boolean)
                                .slice(0, 3);

                            return (
                                <tr
                                    key={header}
                                    className="transition-colors"
                                    style={{ borderBottom: "1px solid var(--border-light)" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                    <td className="py-3 px-4">
                                        <code
                                            className="text-xs px-2 py-1 rounded"
                                            style={{ background: "var(--surface-hover)", color: "var(--text-primary)" }}
                                        >
                                            {header}
                                        </code>
                                    </td>
                                    <td className="py-3 px-4" style={{ color: "var(--text-muted)" }}>
                                        →
                                    </td>
                                    <td className="py-3 px-4">
                                        <select
                                            id={`mapping-${header}`}
                                            value={currentMapping}
                                            onChange={(e) => handleMappingChange(header, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border text-sm"
                                            style={{
                                                background: "var(--surface)",
                                                borderColor: currentMapping ? "var(--brand-primary)" : "var(--border)",
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            <option value="">— Ignorar —</option>
                                            <optgroup label="Campos Padrão">
                                                {LEAD_FIELDS.map((field) => (
                                                    <option
                                                        key={field.key}
                                                        value={field.key}
                                                        disabled={mappedFields.has(field.key) && currentMapping !== field.key}
                                                    >
                                                        {field.label} {field.required ? "*" : ""}
                                                        {mappedFields.has(field.key) && currentMapping !== field.key ? " (já mapeado)" : ""}
                                                    </option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Campo Customizado">
                                                <option value={`custom:${header}`}>
                                                    Criar como: {header}
                                                </option>
                                            </optgroup>
                                        </select>
                                        {currentMapping && (
                                            <Check size={14} className="inline ml-2" style={{ color: "var(--color-success)" }} />
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col gap-0.5">
                                            {sampleValues.map((val, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs truncate max-w-[200px] block"
                                                    style={{ color: "var(--text-muted)" }}
                                                >
                                                    {val}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Validation message */}
            {!isValid && (
                <div
                    className="flex items-center gap-2 mt-4 p-3 rounded-lg text-sm"
                    style={{ background: "#fef3c7", color: "#92400e" }}
                >
                    ⚠️ O campo <strong>Nome</strong> é obrigatório. Mapeie pelo menos a coluna de nome.
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-8">
                <button id="btn-mapping-back" onClick={onBack} className="btn-secondary">
                    <ArrowLeft size={16} />
                    Voltar
                </button>
                <button
                    id="btn-mapping-next"
                    onClick={() => onConfirm(mapping)}
                    disabled={!isValid}
                    className="btn-primary"
                >
                    Continuar
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
