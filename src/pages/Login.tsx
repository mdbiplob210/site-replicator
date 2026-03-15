import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword, isLoginRateLimited, recordLoginAttempt, isValidEmail } from "@/lib/security";

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F1948A", "#82E0AA",
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
        if (data && data.length > 0) {
          navigate("/admin", { replace: true });
        }
      });
    }
  }, [user, isAdmin, authLoading, navigate]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!isValidEmail(email)) {
        toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const pwCheck = validatePassword(password);
        if (!pwCheck.valid) {
          toast({ title: "Weak Password", description: pwCheck.message, variant: "destructive" });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        await recordLoginAttempt(email, true);
        toast({ title: "Success!", description: "Account created. Please verify your email." });
      } else {
        const rateCheck = await isLoginRateLimited(email);
        if (rateCheck.limited) {
          const mins = Math.ceil(rateCheck.remainingSeconds / 60);
          toast({ title: "🚫 Temporarily Blocked", description: `Too many failed attempts. Try again in ${mins} minute(s).`, variant: "destructive" });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) {
          await recordLoginAttempt(email, false);
          throw error;
        }
        await recordLoginAttempt(email, true);
        toast({ title: "🏆 Success!", description: "Logged in successfully!" });
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);
        navigate(roleData && roleData.length > 0 ? "/admin" : "/", { replace: true });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg, #0a0a1e 0%, #1a0a2e 30%, #0a1a2e 60%, #0a0a1e 100%)" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0 hidden sm:block" />

      {/* Login Form */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <div
          className="w-full rounded-2xl p-5 sm:p-8 animate-[portalReveal_0.6s_ease-out]"
          style={{
            maxWidth: 420,
            background: "rgba(15, 15, 40, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(78,205,196,0.3)",
            boxShadow: "0 0 60px rgba(78,205,196,0.15), 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <div className="mb-5 sm:mb-6 text-center">
            <div className="mx-auto mb-2 sm:mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl text-xl sm:text-2xl font-bold"
              style={{
                background: "linear-gradient(135deg, #4ECDC4, #45B7D1)",
                color: "#0a0a1e",
                boxShadow: "0 0 30px rgba(78,205,196,0.4)",
              }}>
              Q
            </div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "#fff" }}>QUICK SHOP BD</h1>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs sm:text-sm" style={{ color: "rgba(78,205,196,0.8)" }}>
              <Star className="h-3 w-3" />
              {isSignUp ? "Create a new account" : "Welcome back"}
              <Star className="h-3 w-3" />
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {isSignUp && (
              <div>
                <Input
                  type="text"
                  placeholder="✨ Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-0 text-sm font-bold"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#000",
                    borderBottom: "2px solid rgba(78,205,196,0.3)",
                    borderRadius: "12px",
                  }}
                />
              </div>
            )}

            <div>
              <Input
                type="email"
                placeholder="📧 Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-0 text-sm font-bold"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#000",
                  borderBottom: "2px solid rgba(78,205,196,0.3)",
                  borderRadius: "12px",
                }}
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="🔐 Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-0 pr-10 text-sm font-bold"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#000",
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
                <span className="flex items-center gap-2"><Zap className="h-4 w-4 animate-spin" /> Loading...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {isSignUp ? "Register" : "Sign In"}
                </span>
              )}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "rgba(78,205,196,0.2)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>or</span>
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
              if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </Button>

          <p className="mt-5 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium hover:underline" style={{ color: "#4ECDC4" }}>
              {isSignUp ? "Sign In" : "Register"}
            </button>
          </p>

          <p className="mt-4 text-center text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2026 QUICK SHOP BD — Secure & Encrypted
          </p>
        </div>
      </div>

      <style>{`
        @keyframes portalReveal { 0% { transform: scale(0.9); opacity: 0; filter: blur(10px); } 100% { transform: scale(1); opacity: 1; filter: blur(0); } }
        input::placeholder { color: rgba(0,0,0,0.5) !important; font-weight: 700 !important; }
      `}</style>
    </div>
  );
};

export default Login;
