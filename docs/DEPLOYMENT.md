# Guia de Deploy — CRM WhatsApp & Email (Vercel)

Siga este passo a passo para colocar sua aplicação online na Vercel.

## 1. Variáveis de Ambiente (Obrigatório)

Você deve configurar as seguintes variáveis no painel da Vercel (**Settings > Environment Variables**):

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Sua Anon Key do Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Sua Service Role Key (necessária para Webhooks e automações).

### Evolution API (WhatsApp)
- `EVOLUTION_API_URL`: URL da sua instância do Evolution API.
- `EVOLUTION_API_KEY`: API Key global do seu servidor Evolution.

### Configurações de App
- `NEXT_PUBLIC_APP_URL`: URL final do deploy (ex: `https://meu-crm.vercel.app`).
- `NEXT_PUBLIC_APP_NAME`: Nome do seu sistema.

## 2. Configurações de Webhook

Para que o Inbox receba mensagens em tempo real:
1. Vá no painel do **Evolution API**.
2. Configure o Webhook global ou da instância para apontar para:
   `https://seu-app.vercel.app/api/whatsapp/webhook`
3. Certifique-se de habilitar os eventos: `MESSAGES_UPSERT`, `CONNECTION_UPDATE`.

## 3. Comandos de Build

A Vercel deve detectar automaticamente as configurações de Next.js, mas para garantir:
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`

---
> [!IMPORTANT]
> Certifique-se de que o banco de dados Supabase já tem todas as migrations aplicadas (`supabase/migrations/*.sql`).
