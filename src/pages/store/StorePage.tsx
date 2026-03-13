import { lazy, Suspense } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// Lazy-load templates - only the active one gets downloaded
const Template1Classic = lazy(() => import("@/components/store/templates/Template1Classic"));
const Template2Dark = lazy(() => import("@/components/store/templates/Template2Dark"));
const Template3Minimal = lazy(() => import("@/components/store/templates/Template3Minimal"));
const Template4Colorful = lazy(() => import("@/components/store/templates/Template4Colorful"));
const Template5Bold = lazy(() => import("@/components/store/templates/Template5Bold"));

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

const StorePage = () => {
  const { data: settings } = useSiteSettings();

  // Don't block rendering - use default template while settings load
  const template = settings?.active_template || "1";

  const TemplateComponent = (() => {
    switch (template) {
      case "2": return Template2Dark;
      case "3": return Template3Minimal;
      case "4": return Template4Colorful;
      case "5": return Template5Bold;
      default: return Template1Classic;
    }
  })();

  return (
    <Suspense fallback={<Loader />}>
      <TemplateComponent />
    </Suspense>
  );
};

export default StorePage;
