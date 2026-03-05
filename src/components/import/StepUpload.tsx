"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, ClipboardPaste, AlertCircle } from "lucide-react";
import {
    parseFile,
    parsePastedData,
    autoDetectMapping,
    type ParsedData,
    type LeadFieldKey,
} from "@/lib/import-parser";

interface StepUploadProps {
    onDataParsed: (data: ParsedData, mapping: Record<string, string>) => void;
}

export function StepUpload({ onDataParsed }: StepUploadProps) {
    const [mode, setMode] = useState<"file" | "paste">("file");
    const [pasteText, setPasteText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const processData = useCallback(
        (data: ParsedData) => {
            if (data.totalRows === 0) {
                setError("Nenhum dado encontrado. Verifique o arquivo ou os dados colados.");
                return;
            }
            const mapping = autoDetectMapping(data.headers);
            onDataParsed(data, mapping);
        },
        [onDataParsed]
    );

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file) return;

            setError(null);
            setLoading(true);

            try {
                const data = await parseFile(file);
                processData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao processar arquivo");
            } finally {
                setLoading(false);
            }
        },
        [processData]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "text/csv": [".csv"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
        },
        maxFiles: 1,
        disabled: loading,
    });

    const handlePaste = () => {
        setError(null);
        try {
            const data = parsePastedData(pasteText);
            processData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao processar dados");
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Mode toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    id="mode-file"
                    onClick={() => setMode("file")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                        background: mode === "file" ? "var(--brand-primary)" : "var(--surface-hover)",
                        color: mode === "file" ? "white" : "var(--text-secondary)",
                    }}
                >
                    <FileSpreadsheet size={16} />
                    Arquivo CSV/Excel
                </button>
                <button
                    id="mode-paste"
                    onClick={() => setMode("paste")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                        background: mode === "paste" ? "var(--brand-primary)" : "var(--surface-hover)",
                        color: mode === "paste" ? "white" : "var(--text-secondary)",
                    }}
                >
                    <ClipboardPaste size={16} />
                    Colar Dados
                </button>
            </div>

            {/* Error */}
            {error && (
                <div
                    className="flex items-center gap-3 p-4 rounded-lg mb-6"
                    style={{ background: "#fee2e2", color: "#991b1b" }}
                >
                    <AlertCircle size={20} />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* File upload mode */}
            {mode === "file" && (
                <div
                    {...getRootProps()}
                    id="dropzone"
                    className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200"
                    style={{
                        borderColor: isDragActive ? "var(--brand-primary)" : "var(--border)",
                        background: isDragActive ? "var(--brand-primary-light)" : "var(--surface)",
                    }}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{
                                background: "var(--brand-primary-light)",
                                color: "var(--brand-primary)",
                            }}
                        >
                            {loading ? (
                                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Upload size={32} />
                            )}
                        </div>

                        {loading ? (
                            <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                                Processando arquivo...
                            </p>
                        ) : isDragActive ? (
                            <p className="text-base font-medium" style={{ color: "var(--brand-primary)" }}>
                                Solte o arquivo aqui!
                            </p>
                        ) : (
                            <>
                                <div>
                                    <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                                        Arraste um arquivo aqui ou{" "}
                                        <span style={{ color: "var(--brand-primary)" }}>clique para selecionar</span>
                                    </p>
                                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                                        Formatos aceitos: CSV (.csv), Excel (.xlsx, .xls) — até 50.000 linhas
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Paste mode */}
            {mode === "paste" && (
                <div>
                    <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                        Cole os dados da sua planilha abaixo. A primeira linha deve conter os nomes das colunas.
                    </p>
                    <textarea
                        id="paste-area"
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder={"Nome\tEmail\tTelefone\nJoão Silva\tjoao@email.com\t+55 11 99999-9999\nMaria Santos\tmaria@email.com\t+55 21 88888-8888"}
                        className="w-full h-48 p-4 rounded-lg border text-sm font-mono resize-y"
                        style={{
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                            color: "var(--text-primary)",
                        }}
                    />
                    <div className="flex justify-end mt-4">
                        <button
                            id="btn-parse-paste"
                            onClick={handlePaste}
                            disabled={!pasteText.trim()}
                            className="btn-primary"
                        >
                            Processar Dados
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
