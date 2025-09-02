-- Add file download tracking
CREATE TABLE public.file_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on file downloads
ALTER TABLE public.file_downloads ENABLE ROW LEVEL SECURITY;

-- Create policies for file downloads
CREATE POLICY "Users can view their own downloads" 
ON public.file_downloads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can track their downloads" 
ON public.file_downloads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add support for post attachments
ALTER TABLE public.discussions ADD COLUMN attachment_urls TEXT[];

-- Add support for user roles and permissions
CREATE TYPE public.user_permission AS ENUM ('admin', 'moderator', 'member');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role user_permission NOT NULL DEFAULT 'member',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE(user_id, role)
);

-- Enable RLS on user roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user roles
CREATE POLICY "User roles are viewable by everyone" 
ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can assign roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Add group member roles
ALTER TABLE public.group_memberships ADD COLUMN permissions TEXT[] DEFAULT ARRAY['view', 'post'];

-- Create group chat messages table
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio')),
  file_url TEXT,
  reply_to UUID REFERENCES public.group_messages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on group messages
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for group messages
CREATE POLICY "Group members can view messages" 
ON public.group_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.group_memberships 
  WHERE group_id = group_messages.group_id AND user_id = auth.uid()
));

CREATE POLICY "Group members can send messages" 
ON public.group_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE group_id = group_messages.group_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.group_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.group_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add real-time support for group messages
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add real-time support for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create call sessions table for WebRTC
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'audio' CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- Enable RLS on call sessions
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for call sessions
CREATE POLICY "Users can view calls they're part of" 
ON public.call_sessions 
FOR SELECT 
USING (
  auth.uid() = caller_id OR 
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = call_sessions.conversation_id AND user_id = auth.uid()
  )) OR
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE group_id = call_sessions.group_id AND user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create calls" 
ON public.call_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update calls they're part of" 
ON public.call_sessions 
FOR UPDATE 
USING (
  auth.uid() = caller_id OR 
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = call_sessions.conversation_id AND user_id = auth.uid()
  )) OR
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE group_id = call_sessions.group_id AND user_id = auth.uid()
  ))
);

-- Create triggers for updated_at
CREATE TRIGGER update_group_messages_updated_at
BEFORE UPDATE ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info',
  notification_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, action_url)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_action_url)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;