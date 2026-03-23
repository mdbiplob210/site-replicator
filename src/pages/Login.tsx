import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { useAuth, type AppRole, type PermissionKey } from "@/contexts/AuthContext";
import { getDefaultAdminRoute } from "@/lib/adminAccess";
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
  const { user, isAdmin, userRoles, userPermissions, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const nextRoute = getDefaultAdminRoute({
        isAdmin,
        userRoles,
        userPermissions,
      });

      navigate(nextRoute ?? "/", { replace: true });
    }
  }, [user, isAdmin, userRoles, userPermissions, authLoading, navigate]);

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
      const normalizedEmail = email.trim().toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
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
          email: normalizedEmail,
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        await recordLoginAttempt(normalizedEmail, true);
        toast({ title: "Success!", description: "Account created. Please verify your email." });
      } else {
        const rateCheck = await isLoginRateLimited(normalizedEmail);
        if (rateCheck.limited) {
          const mins = Math.ceil(rateCheck.remainingSeconds / 60);
          toast({ title: "🚫 Temporarily Blocked", description: `Too many failed attempts. Try again in ${mins} minute(s).`, variant: "destructive" });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) {
          await recordLoginAttempt(normalizedEmail, false);
          throw error;
        }

        await recordLoginAttempt(normalizedEmail, true);
        toast({ title: "🏆 Success!", description: "Logged in successfully!" });

        const [{ data: roleData, error: rolesError }, { data: permissionData, error: permissionsError }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", data.user.id),
          supabase.from("employee_permissions").select("permission").eq("user_id", data.user.id),
        ]);

        if (rolesError) throw rolesError;
        if (permissionsError) throw permissionsError;

        const roles = (roleData || []).map((row) => row.role as AppRole);
        const permissions = (permissionData || []).map((row) => row.permission as PermissionKey);
        const nextRoute = getDefaultAdminRoute({
          isAdmin: roles.includes("admin"),
          userRoles: roles,
          userPermissions: permissions,
        });

        navigate(nextRoute ?? "/", { replace: true });
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
