# Épico 04: Jornadas de Automação Visual

## 🎯 Visão Geral
Este épico foca na criação de um motor de automação visual (estilo Linear/Zapier) onde o usuário pode definir fluxos de trabalho baseados em gatilhos (Triggers) e ações (Actions).

## 🧩 Componentes Principais
1. **Editor Visual (Canvas):** Interface baseada em React Flow para desenhar o fluxo.
2. **Sistema de Triggers:** Início da jornada (Lead Criado, Mudança de Estágio, etc).
3. **Ações de Comunicação:** Email e WhatsApp automáticos.
4. **Lógica de Fluxo:** Esperar (Wait) e Condições (If/Else).
5. **Painel de Controle:** Ativação, Pausa e Métricas em tempo real.

## 🛡️ Segurança e RBAC
- Permissão `journeys.view` para visualizar a lista.
- Permissão `journeys.edit` para criar/editar.
- Permissão `journeys.activate` para ativar fluxos em produção.
