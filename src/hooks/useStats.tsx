import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface StatsData {
  totalFiles: number;
  totalDiscussions: number;
  totalGroups: number;
  recentActivity: number;
  userStats?: {
    filesUploaded: number;
    questionsAsked: number;
    answersGiven: number;
    groupsJoined: number;
  };
}

export const useStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalFiles: 0,
    totalDiscussions: 0,
    totalGroups: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch global stats
      const [filesResult, discussionsResult, groupsResult] = await Promise.all([
        supabase.from('files').select('id', { count: 'exact', head: true }),
        supabase.from('discussions').select('id', { count: 'exact', head: true }),
        supabase.from('study_groups').select('id', { count: 'exact', head: true })
      ]);

      // Fetch recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentActivity } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      // Fetch user-specific stats if logged in
      let userStats = undefined;
      if (user) {
        const [userFiles, userDiscussions, userReplies, userGroups] = await Promise.all([
          supabase.from('files').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('discussions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('discussion_replies').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('group_memberships').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        ]);

        userStats = {
          filesUploaded: userFiles.count || 0,
          questionsAsked: userDiscussions.count || 0,
          answersGiven: userReplies.count || 0,
          groupsJoined: userGroups.count || 0
        };
      }

      setStats({
        totalFiles: filesResult.count || 0,
        totalDiscussions: discussionsResult.count || 0,
        totalGroups: groupsResult.count || 0,
        recentActivity: recentActivity || 0,
        userStats
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};