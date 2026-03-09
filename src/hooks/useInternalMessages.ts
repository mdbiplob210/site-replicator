import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function useInternalMessages(chatWithUserId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all unique conversations (latest message per conversation partner)
  const conversationsQuery = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      
      // Group by conversation partner
      const convMap = new Map<string, any>();
      for (const msg of data || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) {
          const unread = (data || []).filter(
            (m: any) => m.sender_id === partnerId && m.receiver_id === user.id && !m.is_read
          ).length;
          convMap.set(partnerId, { partnerId, lastMessage: msg, unreadCount: unread });
        }
      }
      return Array.from(convMap.values());
    },
    enabled: !!user,
  });

  // Get messages for a specific chat
  const messagesQuery = useQuery({
    queryKey: ["chat-messages", user?.id, chatWithUserId],
    queryFn: async () => {
      if (!user || !chatWithUserId) return [];
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${chatWithUserId}),and(sender_id.eq.${chatWithUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;

      // Mark unread as read
      const unreadIds = (data || [])
        .filter((m: any) => m.receiver_id === user.id && !m.is_read)
        .map((m: any) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("internal_messages")
          .update({ is_read: true })
          .in("id", unreadIds);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }

      return data || [];
    },
    enabled: !!user && !!chatWithUserId,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ receiverId, message }: { receiverId: string; message: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("internal_messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Admin: view all messages
  const allMessagesQuery = useQuery({
    queryKey: ["all-messages-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: false, // Only fetch when explicitly requested
  });

  const totalUnread = (conversationsQuery.data || []).reduce(
    (sum: number, c: any) => sum + c.unreadCount, 0
  );

  // Real-time
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "internal_messages" },
        (payload: any) => {
          const msg = payload.new;
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  return {
    conversations: conversationsQuery.data || [],
    messages: messagesQuery.data || [],
    totalUnread,
    sendMessage,
    allMessagesQuery,
    isLoading: conversationsQuery.isLoading,
  };
}

// Hook for admin to fetch all users for messaging
export function useAllUsers() {
  return useQuery({
    queryKey: ["all-users-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data || [];
    },
  });
}
