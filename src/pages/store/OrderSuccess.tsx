import { Link } from "react-router-dom";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const OrderSuccess = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
    <div className="text-center max-w-md">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Order placed successfully! 🎉</h1>
      <p className="text-gray-500 mb-8">Your order is being processed. We will call you shortly.</p>
      <Link to="/">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Button>
      </Link>
    </div>
  </div>
);

export default OrderSuccess;
