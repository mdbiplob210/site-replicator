import { ReactNode, useState, useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import {
  Search, Sun, Moon, ExternalLink, Bell, MessageSquare,
  LayoutDashboard, BarChart3, Wallet, Package, ShoppingCart,
  Plus, FileText, ListChecks, Lightbulb, Megaphone, Users,
  Globe, Settings, Zap, Database, Check, CheckCheck, Send, X, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserPresence } from "@/hooks/useUserTracking";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useInternalMessages, useAllUsers } from "@/hooks/useInternalMessages";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

const searchPages = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Finance", url: "/admin/finance", icon: Wallet },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Add New Product", url: "/admin/products", icon: Plus },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Tasks", url: "/admin/tasks", icon: ListChecks },
  { title: "Planning", url: "/admin/planning", icon: Lightbulb },
  { title: "Meta Ads", url: "/admin/meta-ads", icon: Megaphone },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Website Settings", url: "/admin/website/settings", icon: Settings },
  { title: "Website", url: "/admin/website", icon: Globe },
  { title: "Automation", url: "/admin/automation", icon: Zap },
  { title: "Backup", url: "/admin/backup", icon: Database },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hooks
  useUserPresence();
  const { theme, toggle: toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { conversations, messages, totalUnread, sendMessage } = useInternalMessages(activeChatUser || undefined);
  const { data: allUsers } = useAllUsers();

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [searchOpen]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filtered = searchPages.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const goTo = (url: string) => {
    navigate(url);
    setSearchOpen(false);
  };

  const handleSendMessage = () => {
    if (!msgInput.trim() || !activeChatUser) return;
    sendMessage.mutate({ receiverId: activeChatUser, message: msgInput.trim() });
    setMsgInput("");
  };

  const getUserName = (userId: string) => {
    const u = allUsers?.find((p) => p.user_id === userId);
    return u?.full_name || "Unknown User";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background transition-colors duration-300">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-12 sm:h-14 flex items-center border-b border-border/40 px-2 sm:px-4 gap-1.5 sm:gap-3 bg-card/90 backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="flex-1" />
            {/* Search Trigger - desktop only */}
            <div
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2.5 bg-secondary/70 rounded-xl px-4 py-2 border border-border/50 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group relative"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground">Search...</span>
              <kbd className="ml-6 text-[10px] bg-card px-2 py-0.5 rounded-md text-muted-foreground/60 border border-border/60 font-mono">⌘K</kbd>
            </div>
            {/* Mobile search button */}
            <button onClick={() => setSearchOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground">
              <Search className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-0">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                title={theme === "light" ? "ডার্ক মোড" : "লাইট মোড"}
              >
                {theme === "light" ? <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /> : <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}
              </button>
              {/* Go to Store */}
              <button
                onClick={() => window.open("/", "_blank")}
                className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all hidden sm:flex"
                title="মেইন পেজ দেখুন"
              >
                <ExternalLink className="h-[18px] w-[18px]" />
              </button>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setChatOpen(false); }}
                  className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all relative"
                >
                  <Bell className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-card">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {/* Notification Dropdown */}
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-12 z-50 w-80 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="text-sm font-bold text-foreground">নোটিফিকেশন</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllRead.mutate()}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <CheckCheck className="h-3 w-3" /> সব পড়া হয়েছে
                          </button>
                        )}
                      </div>
                      <ScrollArea className="max-h-80">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">কোনো নোটিফিকেশন নেই</p>
                        ) : (
                          notifications.map((n: any) => (
                            <div
                              key={n.id}
                              onClick={() => { markAsRead.mutate(n.id); if (n.reference_id) navigate(`/admin/orders`); }}
                              className={`px-4 py-3 border-b border-border/40 cursor-pointer hover:bg-secondary/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.is_read ? "bg-primary" : "bg-transparent"}`} />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                                    {format(new Date(n.created_at), "dd MMM, hh:mm a")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </ScrollArea>
                    </div>
                  </>
                )}
              </div>
              {/* Messages */}
              <div className="relative">
                <button
                  onClick={() => { setChatOpen(!chatOpen); setNotifOpen(false); }}
                  className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all relative"
                >
                  <MessageSquare className="h-[18px] w-[18px]" />
                  {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-card">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </button>
                {/* Chat Panel */}
                {chatOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => { setChatOpen(false); setActiveChatUser(null); }} />
                    <div className="absolute right-0 top-12 z-50 w-96 h-[480px] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
                      {!activeChatUser ? (
                        /* Conversation List */
                        <>
                          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <h3 className="text-sm font-bold text-foreground">মেসেজ</h3>
                            <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <ScrollArea className="flex-1">
                            {/* Show all users to start conversation */}
                            {allUsers?.filter((u) => u.user_id !== user?.id).map((u) => {
                              const conv = conversations.find((c: any) => c.partnerId === u.user_id);
                              return (
                                <button
                                  key={u.user_id}
                                  onClick={() => setActiveChatUser(u.user_id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/30 hover:bg-secondary/50 transition-colors text-left"
                                >
                                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-primary">
                                      {(u.full_name || "U")[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-foreground truncate">{u.full_name || "User"}</p>
                                      {conv?.unreadCount > 0 && (
                                        <span className="min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
                                          {conv.unreadCount}
                                        </span>
                                      )}
                                    </div>
                                    {conv?.lastMessage && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {conv.lastMessage.sender_id === user?.id ? "আপনি: " : ""}
                                        {conv.lastMessage.message}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                            {(!allUsers || allUsers.filter((u) => u.user_id !== user?.id).length === 0) && (
                              <p className="text-sm text-muted-foreground text-center py-8">কোনো ইউজার নেই</p>
                            )}
                          </ScrollArea>
                        </>
                      ) : (
                        /* Chat View */
                        <>
                          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                            <button onClick={() => setActiveChatUser(null)} className="text-muted-foreground hover:text-foreground">
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                {getUserName(activeChatUser)[0].toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-foreground">{getUserName(activeChatUser)}</p>
                          </div>
                          <ScrollArea className="flex-1 p-3">
                            <div className="space-y-2">
                              {messages.map((m: any) => {
                                const isMe = m.sender_id === user?.id;
                                return (
                                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                                      isMe
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                                    }`}>
                                      <p>{m.message}</p>
                                      <p className={`text-[9px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                                        {format(new Date(m.created_at), "hh:mm a")}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                              <div ref={chatEndRef} />
                            </div>
                          </ScrollArea>
                          <div className="p-3 border-t border-border flex gap-2">
                            <input
                              type="text"
                              value={msgInput}
                              onChange={(e) => setMsgInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                              placeholder="মেসেজ লিখুন..."
                              className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border/50 focus:border-primary/50"
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={!msgInput.trim()}
                              className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Search Dropdown */}
          {searchOpen && (
            <>
              <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
              <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search orders, products, pages..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">Pages</p>
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
                  )}
                  {filtered.map((page) => (
                    <button
                      key={page.title}
                      onClick={() => goTo(page.url)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <page.icon className="h-4 w-4 text-muted-foreground" />
                      {page.title}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <main className="flex-1 p-6 overflow-auto scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
