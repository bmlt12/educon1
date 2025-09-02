import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content?: string;
  message_type: string;
  file_url?: string;
  reply_to?: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  id: string;
  name?: string;
  is_group: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  participants?: {
    user_id: string;
    user?: {
      full_name?: string;
      avatar_url?: string;
    };
  }[];
  last_message?: ChatMessage;
}

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: ChatMessage[] }>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            user:profiles!conversation_participants_user_id_fkey(full_name, avatar_url)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          author:profiles!messages_user_id_fkey(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  const createConversation = async (participantIds: string[], isGroup: boolean = false, name?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          created_by: user.id,
          is_group: isGroup,
          name: name
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = [user.id, ...participantIds].map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }));

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) throw participantError;

      await fetchConversations();
      return { conversation, success: true };
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
      return { error: 'Failed to create conversation' };
    }
  };

  const sendMessage = async (conversationId: string, content: string, messageType: string = 'text', fileUrl?: string, replyTo?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
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

  useEffect(() => {
    if (user) {
      fetchConversations();

      // Set up real-time subscription for conversations
      const conversationsChannel = supabase
        .channel('conversations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      // Set up real-time subscription for messages
      const messagesChannel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => ({
              ...prev,
              [newMessage.conversation_id]: [
                ...(prev[newMessage.conversation_id] || []),
                newMessage
              ]
            }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationsChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    createConversation,
    sendMessage,
    fetchMessages,
    refetch: fetchConversations
  };
};