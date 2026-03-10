import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import {
  MessageSquare, Send, Search, Phone, User, ArrowRightLeft,
  Settings, FileText, Zap, ChevronLeft, MoreVertical, Clock,
  CheckCheck, Check, Paperclip, Smile, Bot, Plus, Trash2, Edit2,
  ToggleLeft, ToggleRight, Wifi, WifiOff, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

// Types
interface Conversation {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  assigned_to: string | null;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: string;
  message_type: string;
  content: string;
  media_url: string | null;
  sent_by: string | null;
  status: string;
  created_at: string;
}

// ====== INBOX TAB ======
function InboxTab() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferUserId, setTransferUserId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["wa-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["wa-messages", selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation,
  });

  // Fetch employees for transfer
  const { data: employees = [] } = useQuery({
    queryKey: ["wa-employees"],
    queryFn: async () => {
      const { data: panels } = await supabase
        .from("employee_panels")
        .select("user_id, panel_name, is_active")
        .eq("is_active", true);
      if (!panels?.length) return [];
      const userIds = panels.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      return panels.map(p => ({
        user_id: p.user_id,
        name: profiles?.find(pr => pr.user_id === p.user_id)?.full_name || p.panel_name,
      }));
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("wa-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["wa-messages"] });
        queryClient.invalidateQueries({ queryKey: ["wa-conversations"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["wa-conversations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedConversation || !replyText.trim()) return;
      const { error } = await supabase.from("whatsapp_messages").insert({
        conversation_id: selectedConversation.id,
        direction: "outgoing",
        content: replyText.trim(),
        sent_by: user?.id,
        status: "sent",
      } as any);
      if (error) throw error;
      // Update conversation
      await supabase.from("whatsapp_conversations").update({
        last_message: replyText.trim(),
        last_message_at: new Date().toISOString(),
      } as any).eq("id", selectedConversation.id);
    },
    onSuccess: () => {
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["wa-messages"] });
      queryClient.invalidateQueries({ queryKey: ["wa-conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Transfer conversation
  const transferConversation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation || !transferUserId) return;
      await supabase.from("whatsapp_transfer_logs").insert({
        conversation_id: selectedConversation.id,
        from_user_id: selectedConversation.assigned_to,
        to_user_id: transferUserId,
        transferred_by: user?.id,
      } as any);
      await supabase.from("whatsapp_conversations").update({
        assigned_to: transferUserId,
      } as any).eq("id", selectedConversation.id);
    },
    onSuccess: () => {
      toast.success("কথোপকথন ট্রান্সফার হয়েছে");
      setTransferDialogOpen(false);
      setTransferUserId("");
      queryClient.invalidateQueries({ queryKey: ["wa-conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredConversations = conversations.filter(c =>
    (c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.customer_phone.includes(searchQuery))
  );

  const assignedEmployee = employees.find(e => e.user_id === selectedConversation?.assigned_to);

  return (
    <div className="flex h-[calc(100vh-180px)] rounded-xl border border-border/50 overflow-hidden bg-background">
      {/* Conversation list */}
      <div className={`${selectedConversation ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 border-r border-border/50`}>
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="সার্চ করুন..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-lg text-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">কোনো কথোপকথন নেই</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 ${
                  selectedConversation?.id === conv.id ? "bg-muted/70" : ""
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{conv.customer_name || conv.customer_phone}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(conv.last_message_at), "hh:mm a")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message || "নতুন কথোপকথন"}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {conv.unread_count > 0 && (
                      <Badge className="h-4 px-1.5 text-[10px] bg-emerald-500 text-white">{conv.unread_count}</Badge>
                    )}
                    {conv.status === "open" && <Badge variant="outline" className="h-4 px-1.5 text-[10px] border-emerald-500/50 text-emerald-600">Open</Badge>}
                    {conv.status === "closed" && <Badge variant="outline" className="h-4 px-1.5 text-[10px]">Closed</Badge>}
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-col flex-1`}>
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <button className="md:hidden" onClick={() => setSelectedConversation(null)}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{selectedConversation.customer_name || selectedConversation.customer_phone}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{selectedConversation.customer_phone}</span>
                    {assignedEmployee && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        → {assignedEmployee.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTransferDialogOpen(true)}>
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.direction === "outgoing"
                        ? "bg-emerald-500 text-white rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        msg.direction === "outgoing" ? "text-emerald-100" : "text-muted-foreground"
                      }`}>
                        <span className="text-[10px]">{format(new Date(msg.created_at), "hh:mm a")}</span>
                        {msg.direction === "outgoing" && (
                          msg.status === "read" ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply input */}
            <div className="p-3 border-t border-border/50 bg-muted/20">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="মেসেজ লিখুন..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="min-h-[40px] max-h-[120px] resize-none rounded-xl text-sm"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage.mutate(); } }}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 shrink-0"
                  onClick={() => sendMessage.mutate()}
                  disabled={!replyText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-emerald-500/50" />
            </div>
            <p className="text-lg font-semibold">WhatsApp মেসেজিং</p>
            <p className="text-sm mt-1">বাম পাশ থেকে একটি কথোপকথন সিলেক্ট করুন</p>
          </div>
        )}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>কথোপকথন ট্রান্সফার</DialogTitle>
          </DialogHeader>
          <Select value={transferUserId} onValueChange={setTransferUserId}>
            <SelectTrigger><SelectValue placeholder="এমপ্লয়ি সিলেক্ট করুন" /></SelectTrigger>
            <SelectContent>
              {employees.map(e => (
                <SelectItem key={e.user_id} value={e.user_id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>বাতিল</Button>
            <Button onClick={() => transferConversation.mutate()} disabled={!transferUserId} className="bg-emerald-500 hover:bg-emerald-600">
              ট্রান্সফার
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====== TEMPLATES TAB ======
function TemplatesTab() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");

  const { data: templates = [] } = useQuery({
    queryKey: ["wa-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (editingTemplate) {
        const { error } = await supabase.from("whatsapp_templates").update({ name, content, category } as any).eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("whatsapp_templates").insert({ name, content, category, created_by: user?.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingTemplate ? "টেমপ্লেট আপডেট হয়েছে" : "টেমপ্লেট তৈরি হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["wa-templates"] });
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whatsapp_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("টেমপ্লেট মুছে ফেলা হয়েছে"); queryClient.invalidateQueries({ queryKey: ["wa-templates"] }); },
  });

  const closeDialog = () => { setDialogOpen(false); setEditingTemplate(null); setName(""); setContent(""); setCategory("general"); };

  const openEdit = (t: any) => { setEditingTemplate(t); setName(t.name); setContent(t.content); setCategory(t.category); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">মেসেজ টেমপ্লেট</h3>
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> নতুন টেমপ্লেট
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t: any) => (
          <div key={t.id} className="rounded-xl border border-border/50 p-4 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">{t.name}</p>
              <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{t.content}</p>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(t)}>
                <Edit2 className="h-3 w-3 mr-1" /> এডিট
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                <Trash2 className="h-3 w-3 mr-1" /> মুছুন
              </Button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">কোনো টেমপ্লেট নেই</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTemplate ? "টেমপ্লেট এডিট" : "নতুন টেমপ্লেট"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>নাম</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="টেমপ্লেটের নাম" /></div>
            <div>
              <Label>ক্যাটাগরি</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">সাধারণ</SelectItem>
                  <SelectItem value="greeting">শুভেচ্ছা</SelectItem>
                  <SelectItem value="order">অর্ডার</SelectItem>
                  <SelectItem value="support">সাপোর্ট</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>মেসেজ</Label><Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="টেমপ্লেট মেসেজ লিখুন..." rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>বাতিল</Button>
            <Button onClick={() => saveTemplate.mutate()} disabled={!name || !content} className="bg-emerald-500 hover:bg-emerald-600">সেভ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====== AUTO-REPLY TAB ======
function AutoReplyTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [reply, setReply] = useState("");
  const [matchType, setMatchType] = useState("contains");

  const { data: rules = [] } = useQuery({
    queryKey: ["wa-auto-replies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_auto_replies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addRule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("whatsapp_auto_replies").insert({
        trigger_keyword: keyword, reply_message: reply, match_type: matchType,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("অটো-রিপ্লাই রুল যোগ হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["wa-auto-replies"] });
      setDialogOpen(false); setKeyword(""); setReply(""); setMatchType("contains");
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("whatsapp_auto_replies").update({ is_active: active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wa-auto-replies"] }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whatsapp_auto_replies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("রুল মুছে ফেলা হয়েছে"); queryClient.invalidateQueries({ queryKey: ["wa-auto-replies"] }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">অটো-রিপ্লাই রুলস</h3>
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> নতুন রুল
        </Button>
      </div>

      <div className="space-y-2">
        {rules.map((r: any) => (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card">
            <Bot className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{r.match_type}</Badge>
                <span className="text-sm font-medium">"{r.trigger_keyword}"</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">→ {r.reply_message}</p>
            </div>
            <Switch checked={r.is_active} onCheckedChange={v => toggleRule.mutate({ id: r.id, active: v })} />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRule.mutate(r.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">কোনো অটো-রিপ্লাই রুল নেই</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>নতুন অটো-রিপ্লাই রুল</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>ম্যাচ টাইপ</Label>
              <Select value={matchType} onValueChange={setMatchType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="exact">Exact Match</SelectItem>
                  <SelectItem value="starts_with">Starts With</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>ট্রিগার কিওয়ার্ড</Label><Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="যেমন: হ্যালো, অর্ডার" /></div>
            <div><Label>অটো রিপ্লাই মেসেজ</Label><Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="অটোমেটিক রিপ্লাই..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button onClick={() => addRule.mutate()} disabled={!keyword || !reply} className="bg-emerald-500 hover:bg-emerald-600">সেভ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====== SETTINGS TAB ======
function SettingsTab() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [webhookToken, setWebhookToken] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["wa-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setPhoneNumberId(settings.phone_number_id || "");
      setBusinessAccountId(settings.business_account_id || "");
      setApiToken(settings.api_token || "");
      setWebhookToken(settings.webhook_verify_token || "");
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const payload = {
        phone_number_id: phoneNumberId,
        business_account_id: businessAccountId,
        api_token: apiToken,
        webhook_verify_token: webhookToken,
        is_connected: !!apiToken,
      } as any;
      if (settings?.id) {
        const { error } = await supabase.from("whatsapp_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("whatsapp_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("সেটিংস সেভ হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["wa-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Settings className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">শুধুমাত্র অ্যাডমিন সেটিংস পরিবর্তন করতে পারবে</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${settings?.is_connected ? "bg-emerald-500/10" : "bg-muted"}`}>
          {settings?.is_connected ? <Wifi className="h-5 w-5 text-emerald-500" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div>
          <p className="font-semibold">WhatsApp API সংযোগ</p>
          <p className="text-xs text-muted-foreground">
            {settings?.is_connected ? "সংযুক্ত আছে ✅" : "সংযুক্ত নেই"}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border/50 p-4">
        <div><Label>Phone Number ID</Label><Input value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} placeholder="Meta Phone Number ID" /></div>
        <div><Label>Business Account ID</Label><Input value={businessAccountId} onChange={e => setBusinessAccountId(e.target.value)} placeholder="WhatsApp Business Account ID" /></div>
        <div><Label>API Token</Label><Input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="Permanent Access Token" /></div>
        <div><Label>Webhook Verify Token</Label><Input value={webhookToken} onChange={e => setWebhookToken(e.target.value)} placeholder="Webhook verification token" /></div>
        <Button onClick={() => saveSettings.mutate()} className="w-full bg-emerald-500 hover:bg-emerald-600">
          সেটিংস সেভ করুন
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 p-4 bg-muted/30">
        <p className="text-sm font-semibold mb-2">📋 সেটআপ গাইড</p>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>Meta Business Suite-এ WhatsApp Business API সেটআপ করুন</li>
          <li>Phone Number ID এবং Business Account ID কপি করুন</li>
          <li>একটি Permanent Access Token তৈরি করুন</li>
          <li>Webhook URL সেট করুন এবং Verify Token দিন</li>
        </ol>
      </div>
    </div>
  );
}

// ====== MAIN PAGE ======
export default function AdminWhatsApp() {
  return (
    <AdminLayout>
      <div className="space-y-4 p-2 md:p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold">WhatsApp মেসেজিং</h1>
            <p className="text-xs text-muted-foreground">কাস্টমারদের সাথে WhatsApp-এ কথোপকথন</p>
          </div>
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="inbox" className="text-xs gap-1"><MessageSquare className="h-3.5 w-3.5" /> ইনবক্স</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs gap-1"><FileText className="h-3.5 w-3.5" /> টেমপ্লেট</TabsTrigger>
            <TabsTrigger value="auto-reply" className="text-xs gap-1"><Zap className="h-3.5 w-3.5" /> অটো-রিপ্লাই</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1"><Settings className="h-3.5 w-3.5" /> সেটিংস</TabsTrigger>
          </TabsList>
          <TabsContent value="inbox" className="mt-3"><InboxTab /></TabsContent>
          <TabsContent value="templates" className="mt-3"><TemplatesTab /></TabsContent>
          <TabsContent value="auto-reply" className="mt-3"><AutoReplyTab /></TabsContent>
          <TabsContent value="settings" className="mt-3"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
