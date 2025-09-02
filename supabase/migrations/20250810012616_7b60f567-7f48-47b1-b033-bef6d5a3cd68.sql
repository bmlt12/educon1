-- Fix infinite recursion in conversation_participants RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;

-- Create security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = $1 AND user_id = $2
  );
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view participants of their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
);

-- Also fix conversations table policy that might have similar issues
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;

CREATE POLICY "Users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
USING (
  public.is_conversation_participant(id, auth.uid())
);