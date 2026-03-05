"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StepUpload } from "@/components/import/StepUpload";
import { StepMapping } from "@/components/import/StepMapping";
import { StepConfirm } from "@/components/import/StepConfirm";
import type { ParsedData, LeadFieldKey } from "@/lib/import-parser";

const STEPS = [
    { number: 1, label: "Upload" },
    { number: 2, label: "Mapear Colunas" },
    { number: 3, label: "Confirmar" },
];

export default function ImportLeadsPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "update">("skip");

    const handleDataParsed = (data: ParsedData, mapping: Record<string, string>) => {
        setParsedData(data);
        setColumnMapping(mapping);
        setCurrentStep(2);
    };

    const handleMappingConfirmed = (mapping: Record<string, string>) => {
        setColumnMapping(mapping);
        setCurrentStep(3);
    };

    const handleReset = () => {
        setCurrentStep(1);
        setParsedData(null);
        setColumnMapping({});
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/"
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Importar Leads</h1>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        Importe leads via CSV, Excel ou colando dados
                    </p>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                {STEPS.map((step, idx) => (
                    <div key={step.number} className="flex items-center">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                                style={{
                                    background:
                                        currentStep >= step.number
                                            ? "var(--brand-primary)"
                                            : "var(--surface-active)",
                                    color:
                                        currentStep >= step.number
                                            ? "white"
                                            : "var(--text-muted)",
                                }}
                            >
                                {currentStep > step.number ? "✓" : step.number}
                            </div>
                            <span
                                className="text-sm font-medium"
                                style={{
                                    color:
                                        currentStep >= step.number
                                            ? "var(--text-primary)"
                                            : "var(--text-muted)",
                                }}
                            >
                                {step.label}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div
                                className="w-8 md:w-16 h-0.5 mx-2"
                                style={{
                                    background:
                                        currentStep > step.number
                                            ? "var(--brand-primary)"
                                            : "var(--border)",
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="card p-6 md:p-8">
                {currentStep === 1 && (
                    <StepUpload onDataParsed={handleDataParsed} />
                )}
                {currentStep === 2 && parsedData && (
                    <StepMapping
                        parsedData={parsedData}
                        initialMapping={columnMapping}
                        onConfirm={handleMappingConfirmed}
                        onBack={() => setCurrentStep(1)}
                    />
                )}
                {currentStep === 3 && parsedData && (
                    <StepConfirm
                        parsedData={parsedData}
                        columnMapping={columnMapping}
                        duplicateStrategy={duplicateStrategy}
                        onDuplicateStrategyChange={setDuplicateStrategy}
                        onBack={() => setCurrentStep(2)}
                        onReset={handleReset}
                    />
                )}
            </div>
        </div>
    );
}
