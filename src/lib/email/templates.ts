// ============================================================
// CRM WhatsApp & Email — Email Template Types & Engine
// US 02.2 — Tipos e renderização de templates
// ============================================================

export interface EmailBlock {
    id: string;
    type: "text" | "image" | "button" | "divider" | "columns" | "spacer";
    content: Record<string, string>;
    style?: Record<string, string>;
}

export interface EmailTemplate {
    id: string;
    tenant_id: string;
    name: string;
    subject: string;
    blocks: EmailBlock[];
    styles: {
        backgroundColor: string;
        contentWidth: string;
        fontFamily: string;
    };
    variables: string[]; // e.g. ["nome", "empresa", "email"]
    created_at: string;
    updated_at: string;
}

/**
 * Available template variables for dynamic content
 */
export const TEMPLATE_VARIABLES = [
    { key: "nome", label: "Nome do Lead", example: "João Silva" },
    { key: "email", label: "Email", example: "joao@empresa.com" },
    { key: "empresa", label: "Empresa", example: "TechNova" },
    { key: "telefone", label: "Telefone", example: "+55 11 99999-9999" },
    { key: "cargo", label: "Cargo", example: "Gerente Comercial" },
    { key: "estagio", label: "Estágio no Pipeline", example: "Qualificado" },
];

/**
 * Render a single block to HTML
 */
function renderBlock(block: EmailBlock): string {
    switch (block.type) {
        case "text":
            return `<div style="padding: 16px 24px; font-size: ${block.style?.fontSize || "16px"}; color: ${block.style?.color || "#333333"}; line-height: 1.6;">${block.content.text || ""}</div>`;

        case "image":
            return `<div style="padding: 8px 24px; text-align: ${block.style?.textAlign || "center"};"><img src="${block.content.src || "https://placehold.co/600x200/e2e8f0/64748b?text=Imagem"}" alt="${block.content.alt || ""}" style="max-width: 100%; height: auto; border-radius: ${block.style?.borderRadius || "8px"};" /></div>`;

        case "button":
            return `<div style="padding: 16px 24px; text-align: ${block.style?.textAlign || "center"};"><a href="${block.content.url || "#"}" style="display: inline-block; padding: 12px 32px; background: ${block.style?.backgroundColor || "#6366f1"}; color: ${block.style?.color || "#ffffff"}; text-decoration: none; border-radius: ${block.style?.borderRadius || "8px"}; font-weight: 600; font-size: 14px;">${block.content.text || "Clique aqui"}</a></div>`;

        case "divider":
            return `<div style="padding: 8px 24px;"><hr style="border: none; border-top: 1px solid ${block.style?.borderColor || "#e2e8f0"};" /></div>`;

        case "spacer":
            return `<div style="height: ${block.style?.height || "24px"};"></div>`;

        case "columns":
            return `<div style="padding: 8px 24px; display: flex; gap: 16px;"><div style="flex: 1;">${block.content.left || ""}</div><div style="flex: 1;">${block.content.right || ""}</div></div>`;

        default:
            return "";
    }
}

/**
 * Render full template to HTML string
 */
export function renderTemplate(template: EmailTemplate, variables?: Record<string, string>): string {
    const blocksHtml = template.blocks.map(renderBlock).join("\n");

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
</head>
<body style="margin: 0; padding: 0; background: ${template.styles.backgroundColor || "#f8fafc"}; font-family: ${template.styles.fontFamily || "'Inter', Arial, sans-serif"};">
  <div style="max-width: ${template.styles.contentWidth || "600px"}; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 32px; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    ${blocksHtml}
  </div>
</body>
</html>`.trim();

    // Replace variables
    if (variables) {
        for (const [key, value] of Object.entries(variables)) {
            html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
        }
    }

    return html;
}

/**
 * Create a default empty template
 */
export function createDefaultTemplate(tenantId: string): EmailTemplate {
    return {
        id: `tpl-${Date.now()}`,
        tenant_id: tenantId,
        name: "Novo Template",
        subject: "Assunto do Email",
        blocks: [
            {
                id: "block-1",
                type: "image",
                content: { src: "https://placehold.co/600x120/6366f1/ffffff?text=Seu+Logo", alt: "Logo" },
                style: { textAlign: "center" },
            },
            {
                id: "block-2",
                type: "text",
                content: { text: "<h2>Olá, {{nome}}!</h2><p>Temos uma novidade especial para você.</p>" },
                style: { fontSize: "16px", color: "#333333" },
            },
            {
                id: "block-3",
                type: "button",
                content: { text: "Saiba mais", url: "https://seusite.com" },
                style: { backgroundColor: "#6366f1", color: "#ffffff", textAlign: "center", borderRadius: "8px" },
            },
            {
                id: "block-4",
                type: "divider",
                content: {},
                style: { borderColor: "#e2e8f0" },
            },
            {
                id: "block-5",
                type: "text",
                content: { text: "<p style='font-size: 12px; color: #94a3b8; text-align: center;'>Você recebeu este email porque se cadastrou em nosso sistema.<br/><a href='#' style='color: #6366f1;'>Descadastrar</a></p>" },
                style: { fontSize: "12px", color: "#94a3b8" },
            },
        ],
        styles: {
            backgroundColor: "#f8fafc",
            contentWidth: "600px",
            fontFamily: "'Inter', Arial, sans-serif",
        },
        variables: ["nome", "empresa", "email"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}
