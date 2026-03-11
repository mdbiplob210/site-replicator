import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "আমার ক্যাম্পেইনগুলোর পারফরম্যান্স রিপোর্ট দাও",
  "কোন ক্যাম্পেইনে বেশি বাজেট দেওয়া উচিত?",
  "ROAS কিভাবে বাড়ানো যায়?",
  "আজকের Ad Spend কত হয়েছে?",
  "কোন ক্যাম্পেইন বন্ধ করা উচিত?",
];

export function AdAnalyzerChat({ adAccountId }: { adAccountId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            adAccountId: adAccountId || "all",
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "AI থেকে রেসপন্স পাওয়া যায়নি।");
      // Remove the user message if we got no response
      if (!assistantSoFar) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col" style={{ maxHeight: "600px" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">🤖 AI Ad Analyzer</h3>
            <p className="text-violet-100 text-xs">আপনার Ad ডাটা বিশ্লেষণ করুন AI দিয়ে</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 gap-1.5"
            onClick={() => setMessages([])}
          >
            <Trash2 className="h-3.5 w-3.5" /> ক্লিয়ার
          </Button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">AI Ad Analyzer</p>
              <p className="text-xs text-muted-foreground mt-1">
                আপনার Facebook Ad Account এর ডাটা AI দিয়ে বিশ্লেষণ করুন
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-foreground rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                বিশ্লেষণ করছি...
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="আপনার Ad সম্পর্কে জিজ্ঞাসা করুন..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-[44px] w-[44px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
