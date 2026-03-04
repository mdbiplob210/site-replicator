import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section id="pricing" className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
          আজই শুরু করুন আপনার ই-কমার্স জার্নি
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
          ৩০ সেকেন্ডে ফ্রি অ্যাকাউন্ট খুলুন। কোনো ক্রেডিট কার্ড লাগবে না।
        </p>
        <Link to="/login">
          <Button
            size="lg"
            className="mt-8 gap-2 bg-primary-foreground px-10 text-lg text-primary hover:bg-primary-foreground/90"
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
