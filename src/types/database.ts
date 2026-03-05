// ============================================================
// CRM WhatsApp & Email — Database Types
// Epic 01 / US 01.1 — TypeScript types para o schema
// ============================================================

// =========================
// ENUMS
// =========================

export type UserRole = 'viewer' | 'operator' | 'manager' | 'admin';

export type PlanType = 'free' | 'pro' | 'business';

export type LeadSource = 'csv_import' | 'manual' | 'form' | 'api' | 'whatsapp' | 'website';

export type InteractionType =
  | 'email_sent'
  | 'email_received'
  | 'email_opened'
  | 'email_clicked'
  | 'email_bounced'
  | 'whatsapp_sent'
  | 'whatsapp_received'
  | 'whatsapp_read'
  | 'whatsapp_replied'
  | 'note'
  | 'stage_change'
  | 'tag_change'
  | 'score_change'
  | 'import';

export type ImportStatus = 'processing' | 'completed' | 'failed';

export type JourneyStatus = 'draft' | 'active' | 'paused' | 'archived';

export type EnrollmentStatus = 'active' | 'completed' | 'paused' | 'exited';

// =========================
// TABLE TYPES
// =========================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  logo_url: string | null;
  settings: Record<string, unknown>;
  timezone: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  enabled_by_default: boolean;
  plan_ids: string[];
  created_at: string;
}

export interface TenantFeatureFlag {
  id: string;
  tenant_id: string;
  flag_key: string;
  enabled: boolean;
  reason: string | null;
  created_at: string;
}

export interface Pipeline {
  id: string;
  tenant_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position_title: string | null;
  custom_fields: Record<string, unknown>;
  current_stage_id: string | null;
  lead_score: number;
  source: LeadSource | null;
  source_detail: string | null;
  opted_out_email: boolean;
  opted_out_whatsapp: boolean;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LeadTag {
  id: string;
  lead_id: string;
  tag_id: string;
  created_at: string;
}

export interface LeadStageHistory {
  id: string;
  lead_id: string;
  from_stage_id: string | null;
  to_stage_id: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface Interaction {
  id: string;
  lead_id: string;
  tenant_id: string;
  type: InteractionType;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface ImportLog {
  id: string;
  tenant_id: string;
  filename: string | null;
  total_rows: number;
  created_count: number;
  updated_count: number;
  error_count: number;
  errors: ImportError[];
  status: ImportStatus;
  imported_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

// =========================
// EXTENDED TYPES (with joins)
// =========================

export interface LeadWithRelations extends Lead {
  tags?: Tag[];
  current_stage?: PipelineStage | null;
  interactions_count?: number;
}

export interface PipelineWithStages extends Pipeline {
  stages: PipelineStage[];
}

export interface StageWithLeadCount extends PipelineStage {
  lead_count: number;
}

// =========================
// API REQUEST/RESPONSE TYPES
// =========================

export interface CreateLeadRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position_title?: string;
  custom_fields?: Record<string, unknown>;
  stage_id?: string;
  tags?: string[];
  source?: LeadSource;
  source_detail?: string;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position_title?: string;
  custom_fields?: Record<string, unknown>;
  lead_score?: number;
  opted_out_email?: boolean;
  opted_out_whatsapp?: boolean;
}

export interface MoveLeadStageRequest {
  to_stage_id: string;
}

export interface ImportLeadsRequest {
  filename: string;
  column_mapping: Record<string, string>; // csv_column -> lead_field
  duplicate_strategy: 'skip' | 'update';
  data: Record<string, string>[]; // parsed rows
}

export interface DashboardStats {
  total_leads: number;
  new_leads_7d: number;
  conversion_rate: number;
  avg_time_in_funnel_days: number;
  leads_by_stage: StageWithLeadCount[];
  trend: { date: string; acquired: number; converted: number }[];
}

// =========================
// EMAIL MARKETING TYPES (Epic 02)
// =========================

export type EmailProviderType = 'brevo' | 'resend' | 'sendgrid' | 'smtp';
export type EmailProviderStatus = 'unconfigured' | 'connected' | 'error';
export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
export type EmailSendStatus = 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';

export interface EmailProviderConfig {
  id: string;
  tenant_id: string;
  provider: EmailProviderType;
  is_enabled: boolean;
  api_key_encrypted: string | null;
  from_email: string;
  from_name: string;
  status: EmailProviderStatus;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  name: string;
  subject: string;
  blocks: Record<string, unknown>[];
  styles: Record<string, string>;
  variables: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  tenant_id: string;
  name: string;
  template_id: string | null;
  status: EmailCampaignStatus;
  send_type: 'broadcast' | 'individual';
  recipient_filter: Record<string, unknown>;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailSend {
  id: string;
  campaign_id: string;
  lead_id: string;
  tenant_id: string;
  status: EmailSendStatus;
  provider_message_id: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  error_message: string | null;
  created_at: string;
}

// =========================
// WHATSAPP TYPES (Epic 03)
// =========================

export type WhatsAppProviderType = 'evolution' | 'meta';
export type WhatsAppConversationStatus = 'active' | 'waiting' | 'closed';
export type WhatsAppMessageDirection = 'inbound' | 'outbound';
export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppProviderConfig {
  id: string;
  tenant_id: string;
  provider: WhatsAppProviderType;
  is_enabled: boolean;
  api_url: string | null;
  instance_name: string | null;
  phone_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  phone: string;
  lead_name: string | null;
  status: WhatsAppConversationStatus;
  assigned_to: string | null;
  unread_count: number;
  last_message_text: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  tenant_id: string;
  direction: WhatsAppMessageDirection;
  message_type: string;
  body: string | null;
  media_url: string | null;
  status: WhatsAppMessageStatus;
  sent_by: string | null;
  created_at: string;
}

// =========================
// JOURNEY TYPES (Epic 04)
// =========================

export type JourneyTriggerType = 'manual' | 'lead_created' | 'stage_changed' | 'tag_added' | 'score_threshold' | 'inactivity' | 'form_submitted';
export type JourneyStepType = 'send_email' | 'send_whatsapp' | 'wait' | 'condition' | 'split_ab' | 'update_lead' | 'add_tag' | 'remove_tag' | 'change_stage' | 'webhook' | 'notify_team';

export interface Journey {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  status: JourneyStatus;
  trigger_type: JourneyTriggerType;
  trigger_config: Record<string, unknown>;
  canvas_data: { nodes: unknown[]; edges: unknown[] };
  total_enrolled: number;
  total_completed: number;
  total_dropped: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface JourneyStep {
  id: string;
  journey_id: string;
  tenant_id: string;
  step_type: JourneyStepType;
  name: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
  total_entered: number;
  total_completed: number;
  created_at: string;
}

export interface JourneyEnrollment {
  id: string;
  journey_id: string;
  lead_id: string;
  tenant_id: string;
  status: EnrollmentStatus;
  current_step_id: string | null;
  enrolled_at: string;
  completed_at: string | null;
  ab_variant: string | null;
  created_at: string;
}
