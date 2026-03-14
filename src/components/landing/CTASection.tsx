import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
      <div className="absolute top-0 left-0 h-full w-full opacity-10">
        <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-primary-foreground blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-5 py-2 text-sm font-semibold text-primary-foreground backdrop-blur-sm">
          <Sparkles className="h-4 w-4" />
          ফ্রি ট্রায়াল
        </div>
        <h2 className="mt-6 text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
          আজই শুরু করুন আপনার
          <br />
          ই-কমার্স জার্নি
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-primary-foreground/80">
          ৩০ সেকেন্ডে ফ্রি অ্যাকাউন্ট খুলুন। কোনো ক্রেডিট কার্ড লাগবে না।
        </p>
        <Link to="/login">
          <Button
            size="lg"
            className="mt-10 gap-2 bg-primary-foreground px-12 text-lg font-semibold text-primary shadow-2xl hover:bg-primary-foreground/90 transition-all duration-300 hover:scale-105"
          >
            ফ্রি শুরু করুন
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
