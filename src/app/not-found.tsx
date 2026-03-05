import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--surface)" }}>
            <div className="text-center max-w-md">
                <p
                    className="text-8xl font-black mb-2"
                    style={{
                        background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    404
                </p>
                <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                    Página não encontrada
                </h1>
                <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    A página que você está procurando não existe ou foi movida.
                </p>
                <div className="flex gap-3 justify-center">
                    <Link href="/" className="btn-primary text-sm">
                        Ir para Dashboard
                    </Link>
                    <Link href="/leads" className="btn-secondary text-sm">
                        Ver Leads
                    </Link>
                </div>
            </div>
        </div>
    );
}
