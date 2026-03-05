"use client";

import { useState, useMemo } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Upload,
    RotateCcw,
} from "lucide-react";
import {
    validateLeadRow,
    LEAD_FIELDS,
    type ParsedData,
    type LeadFieldKey,
} from "@/lib/import-parser";

interface StepConfirmProps {
    parsedData: ParsedData;
    columnMapping: Record<string, string>;
    duplicateStrategy: "skip" | "update";
    onDuplicateStrategyChange: (strategy: "skip" | "update") => void;
    onBack: () => void;
    onReset: () => void;
}

interface ImportResult {
    status: "idle" | "importing" | "success" | "error";
    progress: number;
    created: number;
    updated: number;
    errors: number;
    errorDetails: { row: number; field: string; message: string }[];
}

export function StepConfirm({
    parsedData,
    columnMapping,
    duplicateStrategy,
    onDuplicateStrategyChange,
    onBack,
    onReset,
}: StepConfirmProps) {
    const [result, setResult] = useState<ImportResult>({
        status: "idle",
        progress: 0,
        created: 0,
        updated: 0,
        errors: 0,
        errorDetails: [],
    });
    const [tagName, setTagName] = useState("");

    // Pre-validate all rows
    const validation = useMemo(() => {
        let validCount = 0;
        let invalidCount = 0;
        const allErrors: { row: number; field: string; message: string }[] = [];

        parsedData.rows.forEach((row, idx) => {
            const { valid, errors } = validateLeadRow(row, columnMapping, idx + 2); // +2 for header + 1-indexed
            if (valid) validCount++;
            else {
                invalidCount++;
                allErrors.push(...errors);
            }
        });

        return { validCount, invalidCount, errors: allErrors };
    }, [parsedData, columnMapping]);

    // Mapped fields summary
    const mappedFieldsList = useMemo(() => {
        return Object.entries(columnMapping)
            .filter(([, field]) => field)
            .map(([csvCol, field]) => {
                let label = field;
                if (field.startsWith("custom:")) {
                    label = field.replace("custom:", "") + " (Customizado)";
                } else {
                    label = LEAD_FIELDS.find((f) => f.key === field)?.label || field;
                }
                return { csvCol, leadField: label };
            });
    }, [columnMapping]);

    const handleImport = async () => {
        setResult({ status: "importing", progress: 0, created: 0, updated: 0, errors: 0, errorDetails: [] });

        try {
            const response = await fetch("/api/leads/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rows: parsedData.rows,
                    mapping: columnMapping,
                    duplicateStrategy,
                    tagName,
                }),
            });

            if (!response.ok) {
                const resText = await response.text();
                throw new Error("Falha na importação: " + resText);
            }

            // Read streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let finalResult = result;

            if (reader) {
                let done = false;
                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    done = streamDone;
                    if (value) {
                        const text = decoder.decode(value);
                        const lines = text.split("\n").filter(Boolean);
                        for (const line of lines) {
                            try {
                                const data = JSON.parse(line);
                                finalResult = {
                                    status: data.done ? "success" : "importing",
                                    progress: data.progress || 0,
                                    created: data.created || 0,
                                    updated: data.updated || 0,
                                    errors: data.errors || 0,
                                    errorDetails: data.errorDetails || [],
                                };
                                setResult({ ...finalResult });
                            } catch {
                                // Skip malformed lines
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setResult((prev) => ({
                ...prev,
                status: "error",
                errorDetails: [
                    { row: 0, field: "system", message: err instanceof Error ? err.message : "Erro desconhecido" },
                ],
            }));
        }
    };

    // === RESULT SCREEN ===
    if (result.status === "success") {
        return (
            <div className="animate-fade-in text-center py-8">
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: "#dcfce7" }}
                >
                    <CheckCircle2 size={40} style={{ color: "#22c55e" }} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Importação Concluída!</h2>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                    Seus leads foram importados com sucesso.
                </p>

                <div className="flex justify-center gap-6 mb-8">
                    <div className="text-center">
                        <p className="text-3xl font-bold" style={{ color: "var(--color-success)" }}>
                            {result.created}
                        </p>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Criados</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold" style={{ color: "var(--color-info)" }}>
                            {result.updated}
                        </p>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Atualizados</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold" style={{ color: "var(--color-error)" }}>
                            {result.errors}
                        </p>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Erros</p>
                    </div>
                </div>

                {result.errorDetails.length > 0 && (
                    <div
                        className="text-left rounded-lg p-4 mb-6 max-h-48 overflow-y-auto"
                        style={{ background: "#fee2e2" }}
                    >
                        <p className="font-semibold text-sm mb-2" style={{ color: "#991b1b" }}>
                            Detalhes dos erros:
                        </p>
                        {result.errorDetails.slice(0, 20).map((err, i) => (
                            <p key={i} className="text-xs mb-1" style={{ color: "#991b1b" }}>
                                Linha {err.row} — <strong>{err.field}</strong>: {err.message}
                            </p>
                        ))}
                        {result.errorDetails.length > 20 && (
                            <p className="text-xs mt-2 font-medium" style={{ color: "#991b1b" }}>
                                ... e {result.errorDetails.length - 20} erros adicionais
                            </p>
                        )}
                    </div>
                )}

                <button id="btn-import-again" onClick={onReset} className="btn-primary">
                    <RotateCcw size={16} />
                    Importar Novamente
                </button>
            </div>
        );
    }

    // === IMPORTING SCREEN ===
    if (result.status === "importing") {
        return (
            <div className="animate-fade-in text-center py-12">
                <div className="w-16 h-16 mx-auto mb-6">
                    <div
                        className="w-16 h-16 border-4 rounded-full animate-spin"
                        style={{ borderColor: "var(--border)", borderTopColor: "var(--brand-primary)" }}
                    />
                </div>
                <h2 className="text-xl font-bold mb-2">Importando leads...</h2>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                    {result.created + result.updated + result.errors} de {parsedData.totalRows} processados
                </p>

                {/* Progress bar */}
                <div
                    className="w-full max-w-md mx-auto h-3 rounded-full overflow-hidden"
                    style={{ background: "var(--surface-hover)" }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width: `${result.progress}%`,
                            background: "var(--brand-primary)",
                        }}
                    />
                </div>
                <p className="text-sm mt-2 font-medium" style={{ color: "var(--brand-primary)" }}>
                    {result.progress}%
                </p>
            </div>
        );
    }

    // === CONFIRM SCREEN (idle) ===
    return (
        <div className="animate-slide-in">
            <h2 className="text-lg font-semibold mb-6">Confirmar Importação</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>
                        {parsedData.totalRows.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total de linhas</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: "var(--color-success)" }}>
                        {validation.validCount.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Válidos</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: "var(--color-error)" }}>
                        {validation.invalidCount}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Com erros</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: "var(--color-info)" }}>
                        {mappedFieldsList.length}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Campos mapeados</p>
                </div>
            </div>

            {/* Mapped fields */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
                    Mapeamento de campos:
                </h3>
                <div className="flex flex-wrap gap-2">
                    {mappedFieldsList.map(({ csvCol, leadField }) => (
                        <span
                            key={csvCol}
                            className="badge"
                            style={{ background: "var(--brand-primary-light)", color: "var(--brand-primary)" }}
                        >
                            {csvCol} → {leadField}
                        </span>
                    ))}
                </div>
            </div>

            {/* Validation warnings */}
            {validation.invalidCount > 0 && (
                <div
                    className="flex items-start gap-3 p-4 rounded-lg mb-6"
                    style={{ background: "#fef3c7", color: "#92400e" }}
                >
                    <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium">
                            {validation.invalidCount} {validation.invalidCount === 1 ? "linha tem" : "linhas têm"} erros de validação
                        </p>
                        <p className="text-xs mt-1">
                            Linhas inválidas serão ignoradas. Os leads válidos serão importados normalmente.
                        </p>
                    </div>
                </div>
            )}

            {/* Duplicate strategy */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
                    Tratamento de duplicatas (mesmo email ou telefone):
                </h3>
                <div className="flex gap-3">
                    <label
                        className="flex items-center gap-3 cursor-pointer card p-4 flex-1"
                        style={{
                            borderColor: duplicateStrategy === "skip" ? "var(--brand-primary)" : undefined,
                            background: duplicateStrategy === "skip" ? "var(--brand-primary-light)" : undefined,
                        }}
                    >
                        <input
                            type="radio"
                            name="duplicate"
                            value="skip"
                            checked={duplicateStrategy === "skip"}
                            onChange={() => onDuplicateStrategyChange("skip")}
                            className="accent-indigo-500"
                        />
                        <div>
                            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Pular</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                Ignora leads que já existem
                            </p>
                        </div>
                    </label>
                    <label
                        className="flex items-center gap-3 cursor-pointer card p-4 flex-1"
                        style={{
                            borderColor: duplicateStrategy === "update" ? "var(--brand-primary)" : undefined,
                            background: duplicateStrategy === "update" ? "var(--brand-primary-light)" : undefined,
                        }}
                    >
                        <input
                            type="radio"
                            name="duplicate"
                            value="update"
                            checked={duplicateStrategy === "update"}
                            onChange={() => onDuplicateStrategyChange("update")}
                            className="accent-indigo-500"
                        />
                        <div>
                            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Atualizar</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                Atualiza dados do lead existente
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Tag/List selection */}
            <div className="mb-8 card p-4 border" style={{ borderColor: "var(--brand-primary)" }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    Atribuir a uma Tag / Lista
                </h3>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                    Digite o nome de uma tag para atribuir a todos os leads importados. Se a tag não existir, ela será criada.
                </p>
                <input
                    type="text"
                    placeholder="Ex: VSL, Black Friday, Lançamento"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
            </div>

            {/* Actions */}
            <div className="flex justify-between">
                <button id="btn-confirm-back" onClick={onBack} className="btn-secondary">
                    <ArrowLeft size={16} />
                    Voltar
                </button>
                <button
                    id="btn-start-import"
                    onClick={handleImport}
                    disabled={validation.validCount === 0}
                    className="btn-primary"
                >
                    <Upload size={16} />
                    Importar {validation.validCount.toLocaleString()} Leads
                </button>
            </div>

            {result.status === "error" && (
                <div
                    className="flex items-center gap-3 p-4 rounded-lg mt-6"
                    style={{ background: "#fee2e2", color: "#991b1b" }}
                >
                    <XCircle size={20} />
                    <p className="text-sm">
                        {result.errorDetails[0]?.message || "Erro na importação. Tente novamente."}
                    </p>
                </div>
            )}
        </div>
    );
}
