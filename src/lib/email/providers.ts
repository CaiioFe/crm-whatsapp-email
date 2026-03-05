// ============================================================
// CRM WhatsApp & Email — Email Provider Adapter Pattern
// US 02.1 — Interface + adaptadores para múltiplos provedores
// ============================================================

export interface EmailMessage {
    to: string | string[];
    from: string;
    fromName?: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    tags?: string[];
    metadata?: Record<string, string>;
}

export interface EmailSendResult {
    success: boolean;
    messageId?: string;
    provider: string;
    error?: string;
}

export interface EmailProviderConfig {
    provider: "brevo" | "resend" | "sendgrid" | "smtp";
    apiKey?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    fromEmail: string;
    fromName: string;
}

export interface IEmailProvider {
    name: string;
    send(message: EmailMessage): Promise<EmailSendResult>;
    testConnection(): Promise<{ success: boolean; error?: string }>;
}

// ============================================================
// Brevo Provider
// ============================================================
export class BrevoProvider implements IEmailProvider {
    name = "Brevo";
    private apiKey: string;

    constructor(config: EmailProviderConfig) {
        this.apiKey = config.apiKey || "";
    }

    async send(message: EmailMessage): Promise<EmailSendResult> {
        try {
            const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "api-key": this.apiKey,
                },
                body: JSON.stringify({
                    sender: { email: message.from, name: message.fromName },
                    to: (Array.isArray(message.to) ? message.to : [message.to]).map(
                        (email) => ({ email })
                    ),
                    subject: message.subject,
                    htmlContent: message.html,
                    textContent: message.text,
                    replyTo: message.replyTo ? { email: message.replyTo } : undefined,
                    tags: message.tags,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, provider: this.name, error: error.message || "Erro Brevo" };
            }

            const data = await response.json();
            return { success: true, provider: this.name, messageId: data.messageId };
        } catch (err) {
            return {
                success: false,
                provider: this.name,
                error: err instanceof Error ? err.message : "Erro desconhecido",
            };
        }
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch("https://api.brevo.com/v3/account", {
                headers: { "api-key": this.apiKey },
            });
            if (response.ok) return { success: true };
            return { success: false, error: `HTTP ${response.status}` };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : "Erro" };
        }
    }
}

// ============================================================
// Resend Provider
// ============================================================
export class ResendProvider implements IEmailProvider {
    name = "Resend";
    private apiKey: string;

    constructor(config: EmailProviderConfig) {
        this.apiKey = config.apiKey || "";
    }

    async send(message: EmailMessage): Promise<EmailSendResult> {
        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    from: message.fromName
                        ? `${message.fromName} <${message.from}>`
                        : message.from,
                    to: Array.isArray(message.to) ? message.to : [message.to],
                    subject: message.subject,
                    html: message.html,
                    text: message.text,
                    reply_to: message.replyTo,
                    tags: message.tags?.map((t) => ({ name: t, value: "true" })),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, provider: this.name, error: error.message || "Erro Resend" };
            }

            const data = await response.json();
            return { success: true, provider: this.name, messageId: data.id };
        } catch (err) {
            return {
                success: false,
                provider: this.name,
                error: err instanceof Error ? err.message : "Erro desconhecido",
            };
        }
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch("https://api.resend.com/domains", {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            if (response.ok) return { success: true };
            return { success: false, error: `HTTP ${response.status}` };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : "Erro" };
        }
    }
}

// ============================================================
// SendGrid Provider
// ============================================================
export class SendGridProvider implements IEmailProvider {
    name = "SendGrid";
    private apiKey: string;

    constructor(config: EmailProviderConfig) {
        this.apiKey = config.apiKey || "";
    }

    async send(message: EmailMessage): Promise<EmailSendResult> {
        try {
            const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    personalizations: [
                        {
                            to: (Array.isArray(message.to) ? message.to : [message.to]).map(
                                (email) => ({ email })
                            ),
                        },
                    ],
                    from: { email: message.from, name: message.fromName },
                    subject: message.subject,
                    content: [
                        { type: "text/html", value: message.html },
                        ...(message.text ? [{ type: "text/plain", value: message.text }] : []),
                    ],
                    reply_to: message.replyTo ? { email: message.replyTo } : undefined,
                }),
            });

            if (!response.ok) {
                return { success: false, provider: this.name, error: `HTTP ${response.status}` };
            }

            const messageId = response.headers.get("x-message-id") || undefined;
            return { success: true, provider: this.name, messageId };
        } catch (err) {
            return {
                success: false,
                provider: this.name,
                error: err instanceof Error ? err.message : "Erro desconhecido",
            };
        }
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            if (response.ok) return { success: true };
            return { success: false, error: `HTTP ${response.status}` };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : "Erro" };
        }
    }
}

// ============================================================
// Factory
// ============================================================
export function createEmailProvider(config: EmailProviderConfig): IEmailProvider {
    switch (config.provider) {
        case "brevo":
            return new BrevoProvider(config);
        case "resend":
            return new ResendProvider(config);
        case "sendgrid":
            return new SendGridProvider(config);
        case "smtp":
            // SMTP would require nodemailer — placeholder for now
            throw new Error("SMTP provider requer configuração do servidor. Use Edge Function ou API Route com nodemailer.");
        default:
            throw new Error(`Provedor de email não suportado: ${config.provider}`);
    }
}
