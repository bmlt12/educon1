-- Create enum types for better data integrity
CREATE TYPE public.file_type AS ENUM ('document', 'image', 'video', 'audio', 'other');
CREATE TYPE public.post_type AS ENUM ('announcement', 'tip', 'question', 'general');
CREATE TYPE public.group_role AS ENUM ('admin', 'moderator', 'member');

-- Files table for lecture notes and uploads
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type file_type NOT NULL DEFAULT 'document',
  course TEXT,
  tags TEXT[],
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Discussions/Questions table
CREATE TABLE public.discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  course TEXT,
  tags TEXT[],
  is_solved BOOLEAN DEFAULT false,
  vote_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Discussion replies table
CREATE TABLE public.discussion_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Discussion votes table
CREATE TABLE public.discussion_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT discussion_votes_target_check CHECK (
    (discussion_id IS NOT NULL AND reply_id IS NULL) OR 
    (discussion_id IS NULL AND reply_id IS NOT NULL)
  ),
  UNIQUE(user_id, discussion_id),
  UNIQUE(user_id, reply_id)
);

-- Study groups table
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  course TEXT,
  created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 1,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group memberships table
CREATE TABLE public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role group_role DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Posts table for social feed
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type post_type DEFAULT 'general',
  media_urls TEXT[],
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Post likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Chat messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT DEFAULT 'text', -- 'text', 'audio', 'file', 'image'
  file_url TEXT,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  course TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Assignment submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files table
CREATE POLICY "Files are viewable by everyone" ON public.files FOR SELECT USING (true);
CREATE POLICY "Users can insert their own files" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own files" ON public.files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own files" ON public.files FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for discussions table
CREATE POLICY "Discussions are viewable by everyone" ON public.discussions FOR SELECT USING (true);
CREATE POLICY "Users can create discussions" ON public.discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own discussions" ON public.discussions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own discussions" ON public.discussions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for discussion replies table
CREATE POLICY "Discussion replies are viewable by everyone" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON public.discussion_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own replies" ON public.discussion_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own replies" ON public.discussion_replies FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for discussion votes table
CREATE POLICY "Discussion votes are viewable by everyone" ON public.discussion_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.discussion_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes" ON public.discussion_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON public.discussion_votes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study groups table
CREATE POLICY "Study groups are viewable by everyone" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY "Users can create study groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can update their groups" ON public.study_groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Group creators can delete their groups" ON public.study_groups FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for group memberships table
CREATE POLICY "Group memberships are viewable by everyone" ON public.group_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON public.group_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_memberships FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for posts table
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post likes table
CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for post comments table
CREATE POLICY "Post comments are viewable by everyone" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for conversations table
CREATE POLICY "Users can view conversations they participate in" ON public.conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for conversation participants table
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()
  )
);
CREATE POLICY "Users can add themselves to conversations" ON public.conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave conversations" ON public.conversation_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assignments table
CREATE POLICY "Assignments are viewable by everyone" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Users can create assignments" ON public.assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assignments" ON public.assignments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assignments" ON public.assignments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assignment submissions table
CREATE POLICY "Assignment submissions are viewable by everyone" ON public.assignment_submissions FOR SELECT USING (true);
CREATE POLICY "Users can submit assignments" ON public.assignment_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own submissions" ON public.assignment_submissions FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discussions_updated_at
  BEFORE UPDATE ON public.discussions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_discussion_replies_updated_at
  BEFORE UPDATE ON public.discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Functions to update counts automatically
CREATE OR REPLACE FUNCTION public.update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussions 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.discussion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussions 
    SET reply_count = reply_count - 1 
    WHERE id = OLD.discussion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discussion_reply_count_trigger
  AFTER INSERT OR DELETE ON public.discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discussion_reply_count();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION public.update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.discussion_id IS NOT NULL THEN
      UPDATE public.discussions 
      SET vote_count = (
        SELECT COALESCE(SUM(vote_type), 0) 
        FROM public.discussion_votes 
        WHERE discussion_id = NEW.discussion_id
      )
      WHERE id = NEW.discussion_id;
    END IF;
    
    IF NEW.reply_id IS NOT NULL THEN
      UPDATE public.discussion_replies 
      SET vote_count = (
        SELECT COALESCE(SUM(vote_type), 0) 
        FROM public.discussion_votes 
        WHERE reply_id = NEW.reply_id
      )
      WHERE id = NEW.reply_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.discussion_id IS NOT NULL THEN
      UPDATE public.discussions 
      SET vote_count = (
        SELECT COALESCE(SUM(vote_type), 0) 
        FROM public.discussion_votes 
        WHERE discussion_id = NEW.discussion_id
      )
      WHERE id = NEW.discussion_id;
    END IF;
    
    IF NEW.reply_id IS NOT NULL THEN
      UPDATE public.discussion_replies 
      SET vote_count = (
        SELECT COALESCE(SUM(vote_type), 0) 
        FROM public.discussion_votes 
        WHERE reply_id = NEW.reply_id
      )
      WHERE id = NEW.reply_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.discussion_id IS NOT NULL THEN
      UPDATE public.discussions 
      SET vote_count = (
        SELECT COALESCE(SUM(vote_type), 0) 
        FROM public.discussion_votes 
        WHERE discussion_id = OLD.discussion_id
      )
      WHERE id = OLD.discussion_id;
    END IF;
    
    IF OLD.reply_id IS NOT NULL THEN
      UPDATE public.discussion_replies 
      SET vote_count = (
        SELECT COALESCE(SUM(vote_type), 0) 
        FROM public.discussion_votes 
        WHERE reply_id = OLD.reply_id
      )
      WHERE id = OLD.reply_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.discussion_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vote_counts();

-- Function to update group member count
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.study_groups 
    SET member_count = (
      SELECT COUNT(*) 
      FROM public.group_memberships 
      WHERE group_id = NEW.group_id
    )
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.study_groups 
    SET member_count = (
      SELECT COUNT(*) 
      FROM public.group_memberships 
      WHERE group_id = OLD.group_id
    )
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR DELETE ON public.group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Function to update post like and comment counts
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET like_count = like_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_like_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_like_count();

CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET comment_count = comment_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comment_count_trigger
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comment_count();

-- Enable realtime for key tables
ALTER TABLE public.discussions REPLICA IDENTITY FULL;
ALTER TABLE public.discussion_replies REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;