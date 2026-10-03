import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.user_id;
  const queryKey = ['notifications', userId];

  const { data: notifications = [] } = useQuery({
    queryKey,
    enabled: isAuthenticated && !!userId,
    refetchInterval: 60000, // fallback if realtime is unavailable
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
  });

  // Live updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId!)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, markRead, markAllRead };
};
