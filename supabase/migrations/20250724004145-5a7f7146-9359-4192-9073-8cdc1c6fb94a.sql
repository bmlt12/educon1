-- Fix group_messages foreign key to profiles
ALTER TABLE group_messages 
ADD CONSTRAINT group_messages_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

-- Fix conversation participants RLS policies to avoid infinite recursion
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can manage their own conversation participants" ON conversation_participants;

-- Create simpler, non-recursive RLS policies for conversation_participants
CREATE POLICY "Users can view their own participations" ON conversation_participants
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own participations" ON conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own participations" ON conversation_participants  
FOR DELETE USING (user_id = auth.uid());

-- Fix conversations RLS policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid()
  )
);

-- Enable realtime for group_messages
ALTER TABLE group_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- Enable realtime for conversations and conversation_participants
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE conversation_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;