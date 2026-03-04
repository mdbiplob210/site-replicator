import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import AISection from "@/components/landing/AISection";
import AnalyticsSection from "@/components/landing/AnalyticsSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import WebsiteBuilder from "@/components/landing/WebsiteBuilder";
import WhyChoose from "@/components/landing/WhyChoose";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <AISection />
      <AnalyticsSection />
      <DashboardPreview />
      <WebsiteBuilder />
      <WhyChoose />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Landing;
