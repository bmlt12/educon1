import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface GroupData {
  id: string;
  name: string;
  description?: string;
  course?: string;
  is_private: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name?: string;
  };
  is_member?: boolean;
  user_role?: 'admin' | 'moderator' | 'member';
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  member?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export const useGroups = () => {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          creator:profiles!study_groups_created_by_fkey(full_name),
          memberships:group_memberships!group_memberships_group_id_fkey(
            user_id,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add is_member and user_role information
      const groupsWithMembership = data?.map(group => ({
        ...group,
        is_member: group.memberships?.some((m: any) => m.user_id === user?.id) || false,
        user_role: group.memberships?.find((m: any) => m.user_id === user?.id)?.role
      })) || [];

      setGroups(groupsWithMembership);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupData: {
    name: string;
    description?: string;
    course?: string;
    is_private?: boolean;
  }) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          course: groupData.course,
          is_private: groupData.is_private || false,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_memberships')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: "Group created successfully"
      });

      await fetchGroups();
      return { success: true, group };
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive"
      });
      return { error: 'Creation failed' };
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('group_memberships')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Joined group successfully"
      });

      await fetchGroups();
      return { success: true };
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive"
      });
      return { error: 'Join failed' };
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Left group successfully"
      });

      await fetchGroups();
      return { success: true };
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive"
      });
      return { error: 'Leave failed' };
    }
  };

  const fetchGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    try {
      const { data, error } = await supabase
        .from('group_memberships')
        .select(`
          *,
          member:profiles!group_memberships_user_id_fkey(full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    fetchGroupMembers,
    refetch: fetchGroups
  };
};