# Épico 03 — Canais de Chat (WhatsApp)

## 🎯 Visão Geral
Este épico foca na integração do CRM com canais de mensageria instantânea, começando pelo WhatsApp. O objetivo é permitir que o sistema envie mensagens automáticas (através de jornadas) e possibilite a interação manual via Inbox.

## 🧠 Contexto Estratégico
O WhatsApp é o canal de maior conversão no Brasil. Integrá-lo ao CRM não é apenas uma funcionalidade, é o coração da retenção e vendas. Utilizaremos a **Evolution API** como gateway principal por sua estabilidade e suporte a múltiplas instâncias.

## 📋 User Stories
1. **US 03.1: Conexão de Instância (Evolution API)** - Interface para conectar um número via QR Code.
2. **US 03.2: Disparo de Mensagem Individual** - Possibilidade de enviar um "Olá" manual para o lead.
3. **US 03.3: Integração com Jornadas** - Implementação real do nó de "Enviar WhatsApp" no motor de execução.
4. **US 03.4: Inbox Centralizada** - Visualização e resposta de mensagens recebidas.
