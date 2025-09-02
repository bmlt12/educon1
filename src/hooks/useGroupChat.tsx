import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content?: string;
  message_type: 'text' | 'image' | 'document' | 'audio';
  file_url?: string;
  reply_to?: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name?: string;
    avatar_url?: string;
  };
  reply_to_message?: {
    content?: string;
    author?: { full_name?: string };
  };
}

export const useGroupChat = (groupId: string) => {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          author:profiles!group_messages_user_id_profiles_fkey(full_name, avatar_url),
          reply_to_message:group_messages!group_messages_reply_to_fkey(
            content,
            author:profiles!group_messages_user_id_profiles_fkey(full_name)
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as GroupMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [groupId, toast]);

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'document' | 'audio' = 'text', fileUrl?: string, replyTo?: string) => {
    if (!user || !groupId) return { error: 'User not authenticated or no group selected' };

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
          message_type: messageType,
          file_url: fileUrl,
          reply_to: replyTo
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
      return { error: 'Failed to send message' };
    }
  };

  const uploadFile = async (file: File): Promise<{ url?: string; error?: string }> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `group-files/${groupId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('group-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('group-files')
        .getPublicUrl(filePath);

      return { url: data.publicUrl };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { error: 'Failed to upload file' };
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchMessages();

      // Set up real-time subscription
      const channel = supabase
        .channel(`group_messages_${groupId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`
          },
          (payload) => {
            const newMessage = payload.new as GroupMessage;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`
          },
          (payload) => {
            const updatedMessage = payload.new as GroupMessage;
            setMessages(prev => 
              prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`
          },
          (payload) => {
            const deletedMessage = payload.old as GroupMessage;
            setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [groupId, fetchMessages]);

  return {
    messages,
    members: [], // TODO: Implement member fetching
    loading,
    sendMessage,
    uploadFile,
    refetch: fetchMessages
  };
};