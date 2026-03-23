import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { validatePassword } from "@/lib/security";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      toast({ title: "Weak Password", description: pwCheck.message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast({ title: "✅ Success!", description: "Password updated successfully!" });
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0a0a1e 0%, #1a0a2e 30%, #0a1a2e 60%, #0a0a1e 100%)" }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-6 text-center"
          style={{
            background: "rgba(15, 15, 40, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(78,205,196,0.3)",
          }}
        >
          <KeyRound className="h-12 w-12 mx-auto mb-4" style={{ color: "#4ECDC4" }} />
          <h1 className="text-xl font-bold text-white mb-2">Invalid Reset Link</h1>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
            এই লিংকটি বৈধ নয় বা মেয়াদ উত্তীর্ণ হয়ে গেছে।
          </p>
          <Button
            onClick={() => navigate("/login")}
            style={{
              background: "linear-gradient(135deg, #4ECDC4, #45B7D1)",
              color: "#0a0a1e",
              borderRadius: "12px",
            }}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0a0a1e 0%, #1a0a2e 30%, #0a1a2e 60%, #0a0a1e 100%)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: "rgba(15, 15, 40, 0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(78,205,196,0.3)",
          boxShadow: "0 0 60px rgba(78,205,196,0.15)",
        }}
      >
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: "#4ECDC4" }} />
            <h1 className="text-xl font-bold text-white mb-2">পাসওয়ার্ড আপডেট হয়েছে!</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              লগইন পেজে রিডাইরেক্ট হচ্ছে...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <KeyRound className="h-12 w-12 mx-auto mb-3" style={{ color: "#4ECDC4" }} />
              <h1 className="text-xl font-bold text-white">নতুন পাসওয়ার্ড সেট করুন</h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                আপনার নতুন পাসওয়ার্ড লিখুন
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="🔐 New Password"
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

              <Input
                type={showPassword ? "text" : "password"}
                placeholder="🔐 Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-0 text-sm font-bold"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#000",
                  borderBottom: "2px solid rgba(78,205,196,0.3)",
                  borderRadius: "12px",
                }}
              />

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
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </>
        )}
      </div>

      <style>{`
        input::placeholder { color: rgba(0,0,0,0.5) !important; font-weight: 700 !important; }
      `}</style>
    </div>
  );
};

export default ResetPassword;
