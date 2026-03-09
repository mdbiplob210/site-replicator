import { useSiteSettings } from "@/hooks/useSiteSettings";
import Template1Classic from "@/components/store/templates/Template1Classic";
import Template2Dark from "@/components/store/templates/Template2Dark";
import Template3Minimal from "@/components/store/templates/Template3Minimal";
import Template4Colorful from "@/components/store/templates/Template4Colorful";
import Template5Bold from "@/components/store/templates/Template5Bold";

const StorePage = () => {
  const { data: settings, isLoading } = useSiteSettings();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const template = settings?.active_template || "1";

  switch (template) {
    case "2": return <Template2Dark />;
    case "3": return <Template3Minimal />;
    case "4": return <Template4Colorful />;
    case "5": return <Template5Bold />;
    default: return <Template1Classic />;
  }
};

export default StorePage;
