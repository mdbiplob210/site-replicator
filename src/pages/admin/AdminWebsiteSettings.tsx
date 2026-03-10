import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Settings, Home, Sparkles, Globe, Code, RotateCcw,
  Save, Upload, ImageIcon, Phone, Mail, Link, Facebook,
  Instagram, Trash2, Clock, Search, Info, CheckCircle2, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import BannerSettings from "@/components/admin/BannerSettings";

type SettingsTab = "general" | "banners" | "buttons" | "buy_domain" | "tracking" | "data_reset";

const tabs: { id: SettingsTab; label: string; icon: any }[] = [
  { id: "general", label: "General", icon: Home },
  { id: "banners", label: "Banners", icon: Image },
  { id: "buttons", label: "Buttons", icon: Sparkles },
  { id: "buy_domain", label: "Buy Domain", icon: Globe },
  { id: "tracking", label: "Tracking", icon: Code },
  { id: "data_reset", label: "Data Reset", icon: RotateCcw },
];

export default function AdminWebsiteSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [publishEnabled, setPublishEnabled] = useState(false);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Settings className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Website Settings</h1>
              <p className="text-sm text-muted-foreground">Configure your storefront details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Publish</span>
              <Switch checked={publishEnabled} onCheckedChange={setPublishEnabled} />
            </div>
            <Button className="gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === t.id
                  ? "border border-primary text-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "banners" && <BannerSettings />}
        {activeTab === "buttons" && <ButtonsTab />}
        {activeTab === "buy_domain" && <BuyDomainTab />}
        {activeTab === "tracking" && <TrackingTab />}
        {activeTab === "data_reset" && <DataResetTab />}
      </div>
    </AdminLayout>
  );
}


/* ===================== General Tab ===================== */
function GeneralTab() {
  const { data: settings = {}, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPhone2, setContactPhone2] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [messengerLink, setMessengerLink] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [insideDhaka, setInsideDhaka] = useState("0");
  const [outsideDhaka, setOutsideDhaka] = useState("0");
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  // New fields
  const [marqueeText, setMarqueeText] = useState("");
  const [footerDescription, setFooterDescription] = useState("");
  const [footerQuickLinks, setFooterQuickLinks] = useState("");
  const [footerHelpLinks, setFooterHelpLinks] = useState("");
  const [footerAddress, setFooterAddress] = useState("");
  const [footerCopyright, setFooterCopyright] = useState("");
  const [offerCountdownMinutes, setOfferCountdownMinutes] = useState("30");
  const [checkoutScarcityCount, setCheckoutScarcityCount] = useState("47");

  // Load saved values
  if (!loaded && !isLoading && settings) {
    setSiteName(settings["site_name"] || "");
    setSiteUrl(settings["site_url"] || "");
    setTagline(settings["tagline"] || "");
    setContactPhone(settings["phone_number"] || "");
    setContactPhone2(settings["phone_number_2"] || "");
    setWhatsappNumber(settings["whatsapp_number"] || "");
    setMessengerLink(settings["messenger_link"] || "");
    setPaymentNumber(settings["payment_number"] || "");
    setContactEmail(settings["contact_email"] || "");
    setInsideDhaka(settings["delivery_inside_dhaka"] || "0");
    setOutsideDhaka(settings["delivery_outside_dhaka"] || "0");
    setFreeDeliveryAbove(settings["free_delivery_above"] || "");
    setFacebookUrl(settings["facebook_url"] || "");
    setInstagramUrl(settings["instagram_url"] || "");
    setCustomDomain(settings["custom_domain"] || "");
    setLogoUrl(settings["site_logo"] || "");
    setMarqueeText(settings["marquee_text"] || "");
    setFooterDescription(settings["footer_description"] || "");
    setFooterQuickLinks(settings["footer_quick_links"] || "");
    setFooterHelpLinks(settings["footer_help_links"] || "");
    setFooterAddress(settings["footer_address"] || "");
    setFooterCopyright(settings["footer_copyright"] || "");
    setOfferCountdownMinutes(settings["offer_countdown_minutes"] || "30");
    setCheckoutScarcityCount(settings["checkout_scarcity_count"] || "47");
    setLoaded(true);
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be 2MB or less");
      return;
    }
    if (!["image/png", "image/webp", "image/jpeg", "image/svg+xml"].includes(file.type)) {
      toast.error("Only PNG, WebP, JPG or SVG formats supported");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `logo.${ext}`;
      await supabase.storage.from("site-assets").remove([filePath]);
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      setLogoUrl(publicUrl);
      await updateSetting.mutateAsync({ key: "site_logo", value: publicUrl });
      toast.success("Logo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const fileName = logoUrl.split("/").pop()?.split("?")[0];
      if (fileName) {
        await supabase.storage.from("site-assets").remove([fileName]);
      }
      setLogoUrl("");
      await updateSetting.mutateAsync({ key: "site_logo", value: "" });
      toast.success("Logo removed!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSave = async () => {
    const updates = [
      { key: "site_name", value: siteName },
      { key: "site_url", value: siteUrl },
      { key: "tagline", value: tagline },
      { key: "phone_number", value: contactPhone },
      { key: "phone_number_2", value: contactPhone2 },
      { key: "whatsapp_number", value: whatsappNumber },
      { key: "messenger_link", value: messengerLink },
      { key: "payment_number", value: paymentNumber },
      { key: "contact_email", value: contactEmail },
      { key: "delivery_inside_dhaka", value: insideDhaka },
      { key: "delivery_outside_dhaka", value: outsideDhaka },
      { key: "free_delivery_above", value: freeDeliveryAbove },
      { key: "facebook_url", value: facebookUrl },
      { key: "instagram_url", value: instagramUrl },
      { key: "custom_domain", value: customDomain },
      { key: "marquee_text", value: marqueeText },
      { key: "footer_description", value: footerDescription },
      { key: "footer_quick_links", value: footerQuickLinks },
      { key: "footer_help_links", value: footerHelpLinks },
      { key: "footer_address", value: footerAddress },
      { key: "footer_copyright", value: footerCopyright },
      { key: "offer_countdown_minutes", value: offerCountdownMinutes },
      { key: "checkout_scarcity_count", value: checkoutScarcityCount },
    ];
    for (const { key, value } of updates) {
      await updateSetting.mutateAsync({ key, value });
    }
    toast.success("Settings saved!");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Website Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your storefront details</p>
        </div>
        <Button onClick={handleSave} disabled={updateSetting.isPending} className="gap-2">
          <Save className="h-4 w-4" /> {updateSetting.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Store Information - Left Column */}
        <div className="col-span-3 bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="font-bold text-foreground">Store Information</h3>

          {/* Store Logo */}
          <div>
            <label className="text-sm font-medium text-foreground">Store Logo</label>
            <p className="text-xs text-muted-foreground mt-0.5">Suggested size: 200×200px (square), max 2MB. PNG or WebP format recommended.</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/30">
                {logoUrl ? (
                  <img src={logoUrl} alt="Store Logo" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <label>
                  <input type="file" accept="image/png,image/webp,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  <Button variant="outline" className="gap-2" asChild disabled={uploading}>
                    <span><Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload Logo"}</span>
                  </Button>
                </label>
                {logoUrl && (
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={handleRemoveLogo}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Site Name */}
          <div>
            <label className="text-sm font-medium text-foreground">Site Name <span className="text-destructive">*</span></label>
            <p className="text-xs text-muted-foreground">Used in Product Feed, SEO & tab title</p>
            <Input className="mt-1.5" placeholder="Your Store Name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>

          {/* Site URL */}
          <div>
            <label className="text-sm font-medium text-foreground">Site URL <span className="text-destructive">*</span></label>
            <p className="text-xs text-muted-foreground">Used in SEO canonical URL, sitemap & product feed</p>
            <Input className="mt-1.5" placeholder="https://yourstore.com" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
          </div>

          {/* Tagline */}
          <div>
            <label className="text-sm font-medium text-foreground">Tagline</label>
            <p className="text-xs text-muted-foreground">Displayed in footer and SEO description</p>
            <Input className="mt-1.5" placeholder="Welcome to our store" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="text-sm font-medium text-foreground">Contact Phone</label>
            <p className="text-xs text-muted-foreground">Shown in header marquee, footer & product page</p>
            <Input className="mt-1.5" placeholder="+880..." value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>

          {/* Contact Phone 2 */}
          <div>
            <label className="text-sm font-medium text-foreground">Contact Phone 2</label>
            <p className="text-xs text-muted-foreground">Shown as second call button on product page</p>
            <Input className="mt-1.5" placeholder="01XXXXXXXXX" value={contactPhone2} onChange={(e) => setContactPhone2(e.target.value)} />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="text-sm font-medium text-foreground">WhatsApp Number</label>
            <p className="text-xs text-muted-foreground">Used on product page & floating button (with country code)</p>
            <Input className="mt-1.5" placeholder="8801XXXXXXXXX" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
          </div>

          {/* Messenger Link */}
          <div>
            <label className="text-sm font-medium text-foreground">Messenger Link</label>
            <p className="text-xs text-muted-foreground">Used for Messenger button on product page</p>
            <Input className="mt-1.5" placeholder="https://m.me/yourpage" value={messengerLink} onChange={(e) => setMessengerLink(e.target.value)} />
          </div>

          {/* Payment Number */}
          <div>
            <label className="text-sm font-medium text-foreground">Payment Number</label>
            <p className="text-xs text-muted-foreground">bKash/Nagad payment number shown at checkout</p>
            <Input className="mt-1.5" placeholder="01XXXXXXXXX" value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} />
          </div>

          {/* Contact Email */}
          <div>
            <label className="text-sm font-medium text-foreground">Contact Email</label>
            <p className="text-xs text-muted-foreground">Email address shown in footer</p>
            <Input className="mt-1.5" placeholder="support@store.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
        </div>

        {/* Delivery & Social - Right Column */}
        <div className="col-span-2 space-y-5">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
            <h3 className="font-bold text-foreground">Delivery & Social</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Inside Dhaka (৳)</label>
                <p className="text-xs text-muted-foreground">Delivery charge at checkout</p>
                <Input 
                  className="mt-1.5" 
                  value={insideDhaka}
                  onChange={(e) => setInsideDhaka(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Outside Dhaka (৳)</label>
                <p className="text-xs text-muted-foreground">Delivery charge at checkout</p>
                <Input 
                  className="mt-1.5" 
                  value={outsideDhaka}
                  onChange={(e) => setOutsideDhaka(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Free Delivery Above (৳)</label>
              <p className="text-xs text-muted-foreground">Orders above this amount get free delivery</p>
              <Input 
                className="mt-1.5" 
                placeholder="Leave empty to disable"
                value={freeDeliveryAbove}
                onChange={(e) => setFreeDeliveryAbove(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Facebook Page URL</label>
              <p className="text-xs text-muted-foreground">Facebook link shown in footer</p>
              <Input 
                className="mt-1.5" 
                placeholder="https://facebook.com/..."
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Instagram URL</label>
              <p className="text-xs text-muted-foreground">Instagram link shown in footer</p>
              <Input 
                className="mt-1.5" 
                placeholder="https://instagram.com/..."
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-foreground">Custom Domain</h3>
        </div>
        <p className="text-sm text-muted-foreground">Connect your own domain so customers can visit your store at your branded URL. Orders placed through your domain will appear in your Orders dashboard.</p>
        <div>
          <label className="text-sm font-medium text-foreground">Domain Name</label>
          <Input 
            className="mt-1.5" 
            placeholder="store.yourdomain.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
          />
        </div>
      </div>

      {/* Public Store URL */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-foreground">Public Store URL</h3>
        </div>
        <p className="text-sm text-muted-foreground">Share this link with your customers to visit your storefront.</p>
        <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-4 py-3">
          <code className="text-sm text-foreground flex-1">{siteUrl || "https://yourstore.com"}</code>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            navigator.clipboard.writeText(siteUrl);
            toast.success("Copied!");
          }}><Link className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Marquee & Urgency Settings */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="font-bold text-foreground">📢 Header Marquee & Urgency Settings</h3>
        <div>
          <label className="text-sm font-medium text-foreground">Marquee Text (scrolling header text)</label>
          <p className="text-xs text-muted-foreground">Text that scrolls across the top of the store</p>
          <Input className="mt-1.5" placeholder="🚚 Cash on delivery all over Bangladesh..." value={marqueeText} onChange={(e) => setMarqueeText(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Offer Countdown (minutes)</label>
            <p className="text-xs text-muted-foreground">How long the countdown shows on product page</p>
            <Input className="mt-1.5" type="number" placeholder="30" value={offerCountdownMinutes} onChange={(e) => setOfferCountdownMinutes(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Checkout Scarcity Count</label>
            <p className="text-xs text-muted-foreground">Starting number for "Only X slots left" at checkout</p>
            <Input className="mt-1.5" type="number" placeholder="47" value={checkoutScarcityCount} onChange={(e) => setCheckoutScarcityCount(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <h3 className="font-bold text-foreground">📋 Footer Settings</h3>
        <div>
          <label className="text-sm font-medium text-foreground">Footer Description</label>
          <Input className="mt-1.5" placeholder="Best online shopping in Bangladesh..." value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Quick Links</label>
          <p className="text-xs text-muted-foreground">Separate with commas (e.g. Home,All Products,Offers,Contact)</p>
          <Input className="mt-1.5" placeholder="Home,All Products,Offers,Contact" value={footerQuickLinks} onChange={(e) => setFooterQuickLinks(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Help Links</label>
          <p className="text-xs text-muted-foreground">Separate with commas</p>
          <Input className="mt-1.5" placeholder="Delivery Info,Return Policy,Privacy Policy" value={footerHelpLinks} onChange={(e) => setFooterHelpLinks(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Address</label>
            <Input className="mt-1.5" placeholder="Dhaka, Bangladesh" value={footerAddress} onChange={(e) => setFooterAddress(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Copyright Text</label>
            <Input className="mt-1.5" placeholder="© 2026 SHOP BD — All rights reserved" value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Buttons Tab ===================== */
function ButtonsTab() {
  const { data: settings = {}, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [loaded, setLoaded] = useState(false);

  const [orderBtn, setOrderBtn] = useState(true);
  const [orderBtnText, setOrderBtnText] = useState("Order Now");
  const [orderBtnColor, setOrderBtnColor] = useState("#16a34a");
  
  const [cartBtn, setCartBtn] = useState(true);
  const [cartBtnText, setCartBtnText] = useState("Add to Cart");
  const [cartBtnColor, setCartBtnColor] = useState("#2563eb");
  
  const [whatsappBtn, setWhatsappBtn] = useState(true);
  const [whatsappBtnText, setWhatsappBtnText] = useState("WhatsApp");
  const [whatsappBtnColor, setWhatsappBtnColor] = useState("#25d366");

  const [floatingContacts, setFloatingContacts] = useState(true);
  const [floatingWhatsapp, setFloatingWhatsapp] = useState(true);
  const [floatingCall, setFloatingCall] = useState(true);
  const [stickyProduct, setStickyProduct] = useState(false);

  if (!loaded && !isLoading && settings) {
    setOrderBtn(settings["btn_order_enabled"] !== "false");
    setOrderBtnText(settings["btn_order_text"] || "Order Now");
    setOrderBtnColor(settings["btn_order_color"] || "#16a34a");
    setCartBtn(settings["btn_cart_enabled"] !== "false");
    setCartBtnText(settings["btn_cart_text"] || "Add to Cart");
    setCartBtnColor(settings["btn_cart_color"] || "#2563eb");
    setWhatsappBtn(settings["btn_whatsapp_enabled"] !== "false");
    setWhatsappBtnText(settings["btn_whatsapp_text"] || "WhatsApp");
    setWhatsappBtnColor(settings["btn_whatsapp_color"] || "#25d366");
    setFloatingContacts(settings["floating_contacts_enabled"] !== "false");
    setFloatingWhatsapp(settings["floating_whatsapp_enabled"] !== "false");
    setFloatingCall(settings["floating_call_enabled"] !== "false");
    setStickyProduct(settings["sticky_order_btn"] === "true");
    setLoaded(true);
  }

  const handleSave = async () => {
    const entries = [
      { key: "btn_order_enabled", value: String(orderBtn) },
      { key: "btn_order_text", value: orderBtnText },
      { key: "btn_order_color", value: orderBtnColor },
      { key: "btn_cart_enabled", value: String(cartBtn) },
      { key: "btn_cart_text", value: cartBtnText },
      { key: "btn_cart_color", value: cartBtnColor },
      { key: "btn_whatsapp_enabled", value: String(whatsappBtn) },
      { key: "btn_whatsapp_text", value: whatsappBtnText },
      { key: "btn_whatsapp_color", value: whatsappBtnColor },
      { key: "floating_contacts_enabled", value: String(floatingContacts) },
      { key: "floating_whatsapp_enabled", value: String(floatingWhatsapp) },
      { key: "floating_call_enabled", value: String(floatingCall) },
      { key: "sticky_order_btn", value: String(stickyProduct) },
    ];
    try {
      for (const entry of entries) {
        const { data } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", entry.key)
          .maybeSingle();
        if (data) {
          await supabase.from("site_settings").update({ value: entry.value, updated_at: new Date().toISOString() } as any).eq("key", entry.key);
        } else {
          await supabase.from("site_settings").insert({ key: entry.key, value: entry.value, is_public: true } as any);
        }
      }
      toast.success("Button settings saved!");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  const buttons = [
    {
      label: "Order Now Button", enabled: orderBtn, setEnabled: setOrderBtn,
      text: orderBtnText, setText: setOrderBtnText,
      color: orderBtnColor, setColor: setOrderBtnColor,
    },
    {
      label: "Add to Cart Button", enabled: cartBtn, setEnabled: setCartBtn,
      text: cartBtnText, setText: setCartBtnText,
      color: cartBtnColor, setColor: setCartBtnColor,
    },
    {
      label: "WhatsApp Button", enabled: whatsappBtn, setEnabled: setWhatsappBtn,
      text: whatsappBtnText, setText: setWhatsappBtnText,
      color: whatsappBtnColor, setColor: setWhatsappBtnColor,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Button Settings</h2>
          <p className="text-sm text-muted-foreground">Customize storefront buttons and floating contact options</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Save Button Settings
        </Button>
      </div>

      {/* Button Customization */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <h3 className="font-bold text-foreground">Button Customization</h3>
          <p className="text-sm text-muted-foreground">Toggle off to hide buttons from the website</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {buttons.map((btn, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">{btn.label}</h4>
                <Switch checked={btn.enabled} onCheckedChange={btn.setEnabled} />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Button Text</label>
                <Input className="mt-1" value={btn.text} onChange={e => btn.setText(e.target.value)} />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Button Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={btn.color} onChange={e => btn.setColor(e.target.value)} className="h-8 w-8 rounded-lg border border-border cursor-pointer" />
                  <Input value={btn.color} onChange={e => btn.setColor(e.target.value)} className="flex-1" />
                </div>
              </div>

              {/* Preview button */}
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: btn.color, opacity: btn.enabled ? 1 : 0.4 }}
              >
                {btn.text}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Contact Buttons */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">Floating Contact Buttons</h3>
            <p className="text-sm text-muted-foreground">Floating WhatsApp & Phone buttons at the bottom of the store</p>
          </div>
          <Switch checked={floatingContacts} onCheckedChange={setFloatingContacts} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Floating WhatsApp Button</h4>
              <p className="text-xs text-muted-foreground">Uses WhatsApp number from General tab</p>
            </div>
            <Switch checked={floatingWhatsapp} onCheckedChange={setFloatingWhatsapp} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Floating Call Button</h4>
              <p className="text-xs text-muted-foreground">Uses Phone number from General tab</p>
            </div>
            <Switch checked={floatingCall} onCheckedChange={setFloatingCall} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <h4 className="font-medium text-foreground">Sticky Order Button</h4>
            <p className="text-xs text-muted-foreground">Order button stays visible when scrolling product page</p>
          </div>
          <Switch checked={stickyProduct} onCheckedChange={setStickyProduct} />
        </div>
      </div>
    </div>
  );
}

/* ===================== Buy Domain Tab ===================== */
function BuyDomainTab() {
  const [domainSearch, setDomainSearch] = useState("");
  const [tld, setTld] = useState(".com");

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Buy Domain</h3>
        </div>
        <p className="text-sm text-muted-foreground">Find and buy a custom domain for your brand.</p>

        <div>
          <label className="text-sm font-bold text-foreground">Search Domain Name</label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              className="flex-1"
              placeholder="yourbrand"
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
            />
            <Select value={tld} onValueChange={setTld}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=".com">.com</SelectItem>
                <SelectItem value=".net">.net</SelectItem>
                <SelectItem value=".org">.org</SelectItem>
                <SelectItem value=".shop">.shop</SelectItem>
                <SelectItem value=".store">.store</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">.com registration: ৳1200/year &nbsp;&nbsp; Renewal: ৳1500/year</p>

        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-xl p-4">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>After submitting a purchase request, our team will buy the domain and connect it to your store. This usually takes 24-48 hours.</p>
        </div>
      </div>
    </div>
  );
}

/* ===================== Tracking Tab ===================== */
function TrackingTab() {
  const { data: settings = {}, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [trackingActive, setTrackingActive] = useState(true);
  const [gtmId, setGtmId] = useState("");
  const [clarityId, setClarityId] = useState("");
  const [fbPixelId, setFbPixelId] = useState("");
  const [fbAccessToken, setFbAccessToken] = useState("");
  const [fbTestCode, setFbTestCode] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [fbAdAccountId, setFbAdAccountId] = useState("");
  const [fbAppId, setFbAppId] = useState("");
  const [fbAppSecret, setFbAppSecret] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Load saved values
  if (!loaded && !isLoading && settings) {
    setGtmId(settings["gtm_id"] || "");
    setClarityId(settings["clarity_id"] || "");
    setFbPixelId(settings["fb_pixel_id"] || "");
    setFbAccessToken(settings["fb_access_token"] || "");
    setFbTestCode(settings["fb_test_code"] || "");
    setTiktokPixelId(settings["tiktok_pixel_id"] || "");
    setFbAdAccountId(settings["fb_ad_account_id"] || "");
    setFbAppId(settings["fb_app_id"] || "");
    setFbAppSecret(settings["fb_app_secret"] || "");
    setLoaded(true);
  }

  const handleSave = async () => {
    const entries = [
      { key: "gtm_id", value: gtmId },
      { key: "clarity_id", value: clarityId },
      { key: "fb_pixel_id", value: fbPixelId },
      { key: "fb_access_token", value: fbAccessToken },
      { key: "fb_test_code", value: fbTestCode },
      { key: "tiktok_pixel_id", value: tiktokPixelId },
      { key: "fb_ad_account_id", value: fbAdAccountId },
      { key: "fb_app_id", value: fbAppId },
      { key: "fb_app_secret", value: fbAppSecret },
    ];
    const sensitiveKeys = ["fb_access_token", "fb_app_secret", "fb_app_id", "fb_ad_account_id"];
    try {
      for (const entry of entries) {
        const isPublic = !sensitiveKeys.includes(entry.key);
        const { data } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", entry.key)
          .maybeSingle();
        if (data) {
          await supabase.from("site_settings").update({ value: entry.value, is_public: isPublic, updated_at: new Date().toISOString() } as any).eq("key", entry.key);
        } else {
          await supabase.from("site_settings").insert({ key: entry.key, value: entry.value, is_public: isPublic } as any);
        }
      }
      toast.success("Tracking settings saved!");
    } catch (e: any) {
      toast.error("Save failed: " + e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* GTM & Clarity */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Tracking & Analytics</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Active</span>
            <Switch checked={trackingActive} onCheckedChange={setTrackingActive} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Add tracking codes to monitor your store visitors and conversions</p>

        <div>
          <label className="text-sm font-medium text-foreground">Google Tag Manager</label>
          <Input className="mt-1.5" placeholder="GTM-XXXXXXX" value={gtmId} onChange={(e) => setGtmId(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Enter your GTM Container ID</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Microsoft Clarity</label>
          <Input className="mt-1.5" placeholder="abcdefghij" value={clarityId} onChange={(e) => setClarityId(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Enter your Clarity Project ID</p>
        </div>
      </div>

      {/* Facebook Pixel & CAPI */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-foreground">Facebook Pixel & Conversions API</h3>
        </div>
        <p className="text-sm text-muted-foreground">Track conversions with browser-side Pixel and server-side Conversions API for maximum accuracy</p>

        <div>
          <label className="text-sm font-medium text-foreground">Facebook Pixel ID</label>
          <Input className="mt-1.5" placeholder="123456789012345" value={fbPixelId} onChange={(e) => setFbPixelId(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Meta Events Manager → Data Sources → Copy your Pixel ID</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Conversions API Access Token</label>
          <Input className="mt-1.5" type="password" placeholder="EAAxxxxxxxx..." value={fbAccessToken} onChange={(e) => setFbAccessToken(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Meta Events Manager → Settings → Conversions API → Generate Access Token</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Test Event Code (Optional)</label>
          <Input className="mt-1.5" placeholder="TEST12345" value={fbTestCode} onChange={(e) => setFbTestCode(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Use Test Event Code to send events in test mode. Leave empty for production.</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-medium">How to get an Access Token?</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Go to Meta Events Manager → Settings</li>
                <li>Click "Generate Access Token" in the Conversions API section</li>
                <li>Copy the token and paste it here</li>
                <li>Save — server-side events will work automatically</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Ads API Configuration */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-foreground">Meta Ads API Configuration</h3>
        </div>
        <p className="text-sm text-muted-foreground">Enter the required info for Meta Ads data sync and token exchange</p>

        <div>
          <label className="text-sm font-medium text-foreground">Ad Account ID</label>
          <Input className="mt-1.5" placeholder="act_123456789 or 123456789" value={fbAdAccountId} onChange={(e) => setFbAdAccountId(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Meta Business Suite → Ad Accounts → Copy your Ad Account ID</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">App ID</label>
          <Input className="mt-1.5" placeholder="1234567890" value={fbAppId} onChange={(e) => setFbAppId(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Meta Developers → Your App → App ID</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">App Secret</label>
          <Input className="mt-1.5" type="password" placeholder="abcdef1234567890..." value={fbAppSecret} onChange={(e) => setFbAppSecret(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">Meta Developers → Your App → Settings → Basic → App Secret</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-medium">What to do when token expires?</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Generate a new Short-Lived Token (from Graph API Explorer)</li>
                <li>Paste it in the "Conversions API Access Token" field above</li>
                <li>Save — click "Exchange Token" on Meta Ads page for a 60-day token</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* TikTok Pixel */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎵</span>
          <h3 className="font-bold text-foreground">TikTok Pixel</h3>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">TikTok Pixel ID</label>
          <Input className="mt-1.5" placeholder="CXXXXXXXXXXXXXXXXX" value={tiktokPixelId} onChange={(e) => setTiktokPixelId(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">TikTok Ads Manager → Assets → Events → Copy Pixel ID</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📊</span>
          <h3 className="font-bold text-foreground">Coming Soon</h3>
        </div>
        <p className="text-sm text-muted-foreground">Google Analytics 4, Custom Script injection — all can be added here</p>
      </div>

      <Button className="w-full gap-2" onClick={handleSave}>
        <Save className="h-4 w-4" /> Save Tracking Settings
      </Button>
    </div>
  );
}

/* ===================== Data Reset Tab ===================== */
function DataResetTab() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [resetting, setResetting] = useState(false);

  const segments = [
    { id: "orders", label: "Orders", desc: "All orders, order items, blocked orders, incomplete orders", tables: ["order_activity_logs", "order_assignments", "order_items", "courier_orders", "invoices", "incomplete_orders", "orders"] },
    { id: "finance", label: "Finance", desc: "Income/expense records", tables: ["finance_records"] },
    { id: "reports", label: "Reports", desc: "Ad spend records", tables: ["ad_spends"] },
    { id: "ad_spend", label: "Meta Ads Data", desc: "Campaigns, ad sets, ad data", tables: ["meta_ads", "meta_adsets", "meta_campaigns"] },
    { id: "planning", label: "Planning & Tasks", desc: "Task data", tables: ["tasks"] },
  ];

  const toggleSegment = (id: string) => {
    setSelectedSegments((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedSegments.length === segments.length) {
      setSelectedSegments([]);
    } else {
      setSelectedSegments(segments.map((s) => s.id));
    }
  };

  const handleReset = async () => {
    if (selectedSegments.length === 0) return;
    setResetting(true);
    try {
      // Collect all tables to delete from
      const tablesToDelete: string[] = [];
      for (const segId of selectedSegments) {
        const seg = segments.find(s => s.id === segId);
        if (seg) tablesToDelete.push(...seg.tables);
      }

      // Delete in order (child tables first due to foreign keys)
      for (const table of tablesToDelete) {
        const { error } = await supabase.from(table as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) {
          console.error(`Error deleting ${table}:`, error);
        }
      }

      toast.success(`Data from ${selectedSegments.length} segment(s) has been deleted!`);
      setShowDialog(false);
      setSelectedSegments([]);
    } catch (e: any) {
      toast.error("Reset failed: " + e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-2xl border border-destructive/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <RotateCcw className="h-4 w-4 text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Data Reset</h3>
        </div>
        <p className="text-sm text-muted-foreground">Delete data from specific business segments. This action is irreversible.</p>

        <Button variant="destructive" className="gap-2" onClick={() => setShowDialog(true)}>
          <Trash2 className="h-4 w-4" /> Reset Data
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg mx-4 space-y-4">
            <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
              ⚠️ Warning: Data Reset
            </h3>
            <p className="text-sm text-muted-foreground">Select which segments to reset:</p>

            {/* Select All */}
            <label className="flex items-center gap-3 cursor-pointer py-2">
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedSegments.length === segments.length
                    ? "border-primary bg-primary"
                    : "border-border"
                }`}
                onClick={toggleAll}
              >
                {selectedSegments.length === segments.length && (
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              <span className="font-bold text-foreground" onClick={toggleAll}>Select All</span>
            </label>

            {/* Segment List */}
            <div className="space-y-1 border-t border-border pt-2">
              {segments.map((seg) => (
                <label
                  key={seg.id}
                  className="flex items-start gap-3 cursor-pointer py-3 border-b border-border/50 last:border-0"
                  onClick={() => toggleSegment(seg.id)}
                >
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors flex-shrink-0 ${
                      selectedSegments.includes(seg.id)
                        ? "border-primary bg-primary"
                        : "border-border"
                    }`}
                  >
                    {selectedSegments.includes(seg.id) && (
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{seg.label}</p>
                    <p className="text-xs text-muted-foreground">{seg.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowDialog(false); setSelectedSegments([]); }}>
                Cancel
              </Button>
              <Button variant="destructive" className="gap-2" disabled={selectedSegments.length === 0 || resetting} onClick={handleReset}>
                <Trash2 className="h-4 w-4" /> {resetting ? "Resetting..." : `Reset (${selectedSegments.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
