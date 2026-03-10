
CREATE TABLE public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count INT DEFAULT 0,
  assigned_to UUID,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL DEFAULT 'incoming',
  message_type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  media_url TEXT,
  sent_by UUID,
  wa_message_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.whatsapp_auto_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_keyword TEXT NOT NULL,
  reply_message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  match_type TEXT DEFAULT 'contains',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.whatsapp_transfer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID,
  to_user_id UUID NOT NULL,
  transferred_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_provider TEXT DEFAULT 'official',
  phone_number_id TEXT,
  business_account_id TEXT,
  api_token TEXT,
  webhook_verify_token TEXT,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_transfer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_conversations_policy" ON public.whatsapp_conversations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'manage_whatsapp'::employee_permission));

CREATE POLICY "wa_messages_policy" ON public.whatsapp_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'manage_whatsapp'::employee_permission));

CREATE POLICY "wa_templates_policy" ON public.whatsapp_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'manage_whatsapp'::employee_permission));

CREATE POLICY "wa_auto_replies_policy" ON public.whatsapp_auto_replies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'manage_whatsapp'::employee_permission));

CREATE POLICY "wa_transfer_logs_policy" ON public.whatsapp_transfer_logs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_permission(auth.uid(), 'manage_whatsapp'::employee_permission));

CREATE POLICY "wa_settings_policy" ON public.whatsapp_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
