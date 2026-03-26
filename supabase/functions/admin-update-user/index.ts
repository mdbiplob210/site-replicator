import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action, target_user_id } = body;

    const isSelfEdit = target_user_id === caller.id;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Admin check helper
    const requireAdmin = async () => {
      if (isSelfEdit) return;
      const { data: roleData } = await serviceClient.from("user_roles").select("role").eq("user_id", caller.id).in("role", ["admin", "super_admin"]);
      if (!roleData || roleData.length === 0) {
        throw new Error("Admin access required");
      }
    };

    if (action === "update_auth") {
      await requireAdmin();
      const { email, password, full_name } = body;
      const updates: any = {};
      if (email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length > 0) {
        const { error } = await serviceClient.auth.admin.updateUserById(target_user_id, updates);
        if (error) throw new Error(error.message);
      }

      if (full_name !== undefined) {
        await serviceClient.from("profiles").update({ full_name }).eq("user_id", target_user_id);
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get_user_email") {
      await requireAdmin();
      const { data, error } = await serviceClient.auth.admin.getUserById(target_user_id);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ email: data.user.email, phone: data.user.phone, banned: data.user.banned_until !== null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "disable_user") {
      // Can't disable yourself
      if (isSelfEdit) throw new Error("নিজেকে ডিসেবল করা যাবে না");
      await requireAdmin();
      const { disabled } = body; // true = ban, false = unban
      const banData = disabled
        ? { banned_until: "2099-12-31T23:59:59Z" }
        : { banned_until: null as any };
      const { error } = await serviceClient.auth.admin.updateUserById(target_user_id, banData as any);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ success: true, disabled }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete_user") {
      if (isSelfEdit) throw new Error("নিজেকে ডিলিট করা যাবে না");
      await requireAdmin();
      // Delete related data first
      await serviceClient.from("user_roles").delete().eq("user_id", target_user_id);
      await serviceClient.from("employee_permissions").delete().eq("user_id", target_user_id);
      await serviceClient.from("employee_panels").delete().eq("user_id", target_user_id);
      await serviceClient.from("order_assignments").delete().eq("assigned_to", target_user_id);
      await serviceClient.from("notifications").delete().eq("user_id", target_user_id);
      await serviceClient.from("profiles").delete().eq("user_id", target_user_id);
      // Delete auth user
      const { error } = await serviceClient.auth.admin.deleteUser(target_user_id);
      if (error) throw new Error(error.message);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
