import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Sparkles, Zap, Trophy, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Floating particle
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  opacity: number;
}

// Collectible orb
interface Orb {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  color: string;
  emoji: string;
}

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F1948A", "#82E0AA",
];

const EMOJIS = ["🔑", "⭐", "💎", "🎯", "🔮"];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [portalOpen, setPortalOpen] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(false);
  const [combo, setCombo] = useState(0);
  const [shakePortal, setShakePortal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Generate orbs
  useEffect(() => {
    const newOrbs: Orb[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 60,
      collected: false,
      color: COLORS[i % COLORS.length],
      emoji: EMOJIS[i],
    }));
    setOrbs(newOrbs);
  }, []);

  // Show hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Particle canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const bgParticles: { x: number; y: number; r: number; dx: number; dy: number; color: string; alpha: number }[] = [];
    for (let i = 0; i < 80; i++) {
      bgParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.8,
        dy: (Math.random() - 0.5) * 0.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const animate = () => {
      ctx.fillStyle = "rgba(10, 10, 30, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      bgParticles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw connections
      for (let i = 0; i < bgParticles.length; i++) {
        for (let j = i + 1; j < bgParticles.length; j++) {
          const dist = Math.hypot(bgParticles[i].x - bgParticles[j].x, bgParticles[i].y - bgParticles[j].y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(bgParticles[i].x, bgParticles[i].y);
            ctx.lineTo(bgParticles[j].x, bgParticles[j].y);
            ctx.strokeStyle = bgParticles[i].color;
            ctx.globalAlpha = 0.08 * (1 - dist / 120);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Burst particles on orb collect
  const burstParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      size: Math.random() * 8 + 4,
      color,
      speedX: (Math.random() - 0.5) * 10,
      speedY: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 800);
  }, []);

  const collectOrb = (orb: Orb) => {
    if (orb.collected) return;
    setOrbs((prev) => prev.map((o) => (o.id === orb.id ? { ...o, collected: true } : o)));
    const newScore = score + 1;
    setScore(newScore);
    setCombo((c) => c + 1);
    burstParticles(orb.x, orb.y, orb.color);

    if (newScore >= 3 && !portalOpen) {
      setPortalOpen(true);
      setShakePortal(true);
      setTimeout(() => setShakePortal(false), 600);
      toast({ title: "🎉 পোর্টাল খুলেছে!", description: "এখন প্রবেশ করুন QUICK SHOP BD তে!" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "সফল!", description: "অ্যাকাউন্ট তৈরি হয়েছে। ইমেইল ভেরিফাই করুন।" });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "🏆 সফল!", description: "সফলভাবে লগইন হয়েছে!" });
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();
        navigate(roleData ? "/admin" : "/", { replace: true });
      }
    } catch (error: any) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      style={{ background: "linear-gradient(135deg, #0a0a1e 0%, #1a0a2e 30%, #0a1a2e 60%, #0a0a1e 100%)" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Custom cursor glow */}
      <div
        className="pointer-events-none fixed z-50 rounded-full mix-blend-screen"
        style={{
          left: mousePos.x - 60,
          top: mousePos.y - 60,
          width: 120,
          height: 120,
          background: "radial-gradient(circle, rgba(78,205,196,0.3) 0%, transparent 70%)",
          transition: "left 0.05s, top 0.05s",
        }}
      />

      {/* Score HUD */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
          style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", color: "#4ECDC4" }}>
          <Trophy className="h-4 w-4" />
          <span>{score}/5</span>
        </div>
        {combo > 1 && (
          <div className="animate-bounce rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #FF6B6B, #FFEAA7)", color: "#1a0a2e" }}>
            {combo}x COMBO! 🔥
          </div>
        )}
      </div>

      {/* Title */}
      <div className="absolute top-4 right-4 z-30 text-right">
        <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
          {portalOpen ? "✨ পোর্টাল সক্রিয়" : "🎮 অর্ব সংগ্রহ করুন"}
        </div>
      </div>

      {/* Hint */}
      {showHint && !portalOpen && (
        <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 animate-pulse rounded-full px-6 py-2 text-sm"
          style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(78,205,196,0.3)", color: "#4ECDC4" }}>
          <Sparkles className="mr-2 inline h-4 w-4" />
          ঝলমলে অর্বগুলোতে ক্লিক করুন! ৩টি সংগ্রহ করলে পোর্টাল খুলবে
        </div>
      )}

      {/* Floating Orbs */}
      {orbs.map((orb) =>
        !orb.collected ? (
          <button
            key={orb.id}
            onClick={() => collectOrb(orb)}
            className="absolute z-20 flex items-center justify-center rounded-full transition-transform hover:scale-125"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: 56,
              height: 56,
              background: `radial-gradient(circle at 30% 30%, ${orb.color}dd, ${orb.color}66)`,
              boxShadow: `0 0 30px ${orb.color}80, 0 0 60px ${orb.color}40, inset 0 0 20px rgba(255,255,255,0.2)`,
              animation: `float-orb-${orb.id} ${3 + orb.id * 0.5}s ease-in-out infinite`,
              cursor: "pointer",
            }}
          >
            <span className="text-2xl">{orb.emoji}</span>
          </button>
        ) : null
      )}

      {/* Burst particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute z-30 rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 10px ${p.color}`,
            animation: "burst 0.8s ease-out forwards",
          }}
        />
      ))}

      {/* Central Portal / Login Form */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div
          className={`relative transition-all duration-1000 ${shakePortal ? "animate-[shake_0.6s_ease-in-out]" : ""}`}
          style={{
            width: portalOpen ? 420 : 160,
            height: portalOpen ? "auto" : 160,
            minHeight: portalOpen ? undefined : 160,
          }}
        >
          {/* Portal ring (before open) */}
          {!portalOpen && (
            <div
              className="flex h-full w-full cursor-pointer items-center justify-center rounded-full"
              onClick={() => {
                if (score < 3) {
                  toast({ title: "🔒 লক আছে!", description: `আরো ${3 - score}টি অর্ব সংগ্রহ করুন!`, variant: "destructive" });
                }
              }}
              style={{
                background: "radial-gradient(circle, rgba(78,205,196,0.15) 0%, transparent 70%)",
                border: "3px solid rgba(78,205,196,0.4)",
                boxShadow: "0 0 40px rgba(78,205,196,0.2), inset 0 0 40px rgba(78,205,196,0.1)",
                animation: "pulse-portal 3s ease-in-out infinite",
              }}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🔒</div>
                <div className="text-xs font-medium" style={{ color: "rgba(78,205,196,0.8)" }}>
                  {score}/3 অর্ব
                </div>
              </div>
            </div>
          )}

          {/* Login Form (after portal opens) */}
          {portalOpen && (
            <div
              className="animate-[portalReveal_0.8s_ease-out] rounded-2xl p-8"
              style={{
                background: "rgba(15, 15, 40, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(78,205,196,0.3)",
                boxShadow: "0 0 60px rgba(78,205,196,0.15), 0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, #4ECDC4, #45B7D1)",
                    color: "#0a0a1e",
                    boxShadow: "0 0 30px rgba(78,205,196,0.4)",
                  }}>
                  S
                </div>
                <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>QUICK SHOP BD</h1>
                <p className="mt-1 flex items-center justify-center gap-1 text-sm" style={{ color: "rgba(78,205,196,0.8)" }}>
                  <Star className="h-3 w-3" />
                  {isSignUp ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "পোর্টালে প্রবেশ করুন"}
                  <Star className="h-3 w-3" />
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <Input
                      type="text"
                      placeholder="✨ আপনার নাম"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="border-0 text-sm"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        borderBottom: "2px solid rgba(78,205,196,0.3)",
                        borderRadius: "12px",
                      }}
                    />
                  </div>
                )}

                <div>
                  <Input
                    type="email"
                    placeholder="📧 ইমেইল"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-0 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                      borderBottom: "2px solid rgba(78,205,196,0.3)",
                      borderRadius: "12px",
                    }}
                  />
                </div>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="🔐 পাসওয়ার্ড"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-0 pr-10 text-sm"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                      borderBottom: "2px solid rgba(78,205,196,0.3)",
                      borderRadius: "12px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(78,205,196,0.6)" }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full border-0 text-base font-bold"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(135deg, #4ECDC4, #45B7D1, #96CEB4)",
                    color: "#0a0a1e",
                    borderRadius: "12px",
                    boxShadow: "0 0 20px rgba(78,205,196,0.3)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><Zap className="h-4 w-4 animate-spin" /> লোডিং...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {isSignUp ? "রেজিস্টার" : "প্রবেশ করুন"}
                    </span>
                  )}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "rgba(78,205,196,0.2)" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>অথবা</span>
                <div className="h-px flex-1" style={{ background: "rgba(78,205,196,0.2)" }} />
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 border-0 text-sm"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                }}
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
                }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google দিয়ে প্রবেশ
              </Button>

              <p className="mt-5 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {isSignUp ? "অ্যাকাউন্ট আছে?" : "অ্যাকাউন্ট নেই?"}{" "}
                <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium hover:underline" style={{ color: "#4ECDC4" }}>
                  {isSignUp ? "প্রবেশ করুন" : "রেজিস্টার করুন"}
                </button>
              </p>

              <p className="mt-4 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                © 2026 QUICK SHOP BD — Secure & Encrypted
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 z-30 h-1 transition-all duration-500"
        style={{
          width: `${(score / 3) * 100}%`,
          background: "linear-gradient(90deg, #FF6B6B, #4ECDC4, #45B7D1, #FFEAA7)",
          boxShadow: "0 0 10px rgba(78,205,196,0.5)",
        }}
      />

      <style>{`
        @keyframes float-orb-0 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(15px, -20px) rotate(10deg); } }
        @keyframes float-orb-1 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-20px, 15px) rotate(-10deg); } }
        @keyframes float-orb-2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(10px, 25px); } }
        @keyframes float-orb-3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-15px, -15px); } }
        @keyframes float-orb-4 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, 10px); } }
        @keyframes pulse-portal { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes portalReveal { 0% { transform: scale(0.3) rotate(-10deg); opacity: 0; filter: blur(20px); } 100% { transform: scale(1) rotate(0); opacity: 1; filter: blur(0); } }
        @keyframes burst { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0) translate(var(--tx, 20px), var(--ty, -20px)); opacity: 0; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        input::placeholder { color: rgba(255,255,255,0.35) !important; }
      `}</style>
    </div>
  );
};

export default Login;
