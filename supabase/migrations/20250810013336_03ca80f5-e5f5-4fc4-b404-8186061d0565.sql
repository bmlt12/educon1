-- Fix RLS policy for conversations table - users should be able to create conversations
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Fix foreign key relationship for group_messages to profiles
-- First check if the foreign key exists, if not create it
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'group_messages_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.group_messages 
        ADD CONSTRAINT group_messages_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
    END IF;
END $$;

-- Also fix messages table foreign key to profiles if needed
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);
    END IF;
END $$;

-- Ensure RLS policies for conversations allow users to update conversations they created
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;

CREATE POLICY "Users can update their conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = created_by);