import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface DiscussionData {
  id: string;
  title: string;
  content: string;
  course?: string;
  tags?: string[];
  attachment_urls?: string[];
  is_solved: boolean;
  vote_count: number;
  reply_count: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name?: string;
  };
}

export interface DiscussionReply {
  id: string;
  content: string;
  is_solution: boolean;
  vote_count: number;
  user_id: string;
  discussion_id: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name?: string;
  };
}

export const useDiscussions = () => {
  const [discussions, setDiscussions] = useState<DiscussionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          author:profiles!discussions_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscussions(data || []);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDiscussion = async (discussionData: {
    title: string;
    content: string;
    course?: string;
    tags?: string[];
    attachments?: File[];
  }) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      let attachmentUrls: string[] = [];

      // Upload attachments if provided
      if (discussionData.attachments && discussionData.attachments.length > 0) {
        for (const file of discussionData.attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `discussion-attachments/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('lecture-files')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('lecture-files')
            .getPublicUrl(filePath);

          attachmentUrls.push(data.publicUrl);
        }
      }

      const { error } = await supabase
        .from('discussions')
        .insert({
          title: discussionData.title,
          content: discussionData.content,
          course: discussionData.course,
          tags: discussionData.tags,
          attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discussion created successfully"
      });

      await fetchDiscussions();
      return { success: true };
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast({
        title: "Error",
        description: "Failed to create discussion",
        variant: "destructive"
      });
      return { error: 'Creation failed' };
    }
  };

  const fetchReplies = async (discussionId: string): Promise<DiscussionReply[]> => {
    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .select(`
          *,
          author:profiles!discussion_replies_user_id_fkey(full_name)
        `)
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
  };

  const createReply = async (discussionId: string, content: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('discussion_replies')
        .insert({
          content,
          discussion_id: discussionId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply posted successfully"
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      });
      return { error: 'Reply failed' };
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const voteOnDiscussion = async (discussionId: string, voteType: 1 | -1) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('discussion_votes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        // Update existing vote
        const { error } = await supabase
          .from('discussion_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from('discussion_votes')
          .insert({
            discussion_id: discussionId,
            user_id: user.id,
            vote_type: voteType
          });

        if (error) throw error;
      }

      await fetchDiscussions();
      return { success: true };
    } catch (error) {
      console.error('Error voting on discussion:', error);
      return { error: 'Vote failed' };
    }
  };

  const forwardDiscussion = async (discussionId: string, recipientIds: string[]) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const discussion = discussions.find(d => d.id === discussionId);
      if (!discussion) return { error: 'Discussion not found' };

      // Create notifications for recipients
      for (const recipientId of recipientIds) {
        await supabase.rpc('create_notification', {
          target_user_id: recipientId,
          notification_title: 'Discussion Forwarded',
          notification_message: `${user.email} shared a discussion: "${discussion.title}"`,
          notification_type: 'info',
          notification_action_url: `/discussions?id=${discussionId}`
        });
      }

      toast({
        title: "Success",
        description: "Discussion forwarded successfully"
      });

      return { success: true };
    } catch (error) {
      console.error('Error forwarding discussion:', error);
      toast({
        title: "Error",
        description: "Failed to forward discussion",
        variant: "destructive"
      });
      return { error: 'Forward failed' };
    }
  };

  return {
    discussions,
    loading,
    createDiscussion,
    fetchReplies,
    createReply,
    voteOnDiscussion,
    forwardDiscussion,
    refetch: fetchDiscussions
  };
};