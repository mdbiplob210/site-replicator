import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "QUICK SHOP BD কি ফ্রি ব্যবহার করা যায়?",
    a: "হ্যাঁ! QUICK SHOP BD-তে একটি ফ্রি প্ল্যান আছে যেখানে আপনি বেসিক ফিচারগুলো ব্যবহার করতে পারবেন। অ্যাডভান্সড ফিচারের জন্য পেইড প্ল্যান আপগ্রেড করতে পারবেন।",
  },
  {
    q: "ফেক অর্ডার ডিটেকশন কিভাবে কাজ করে?",
    a: "আমাদের AI সিস্টেম কাস্টমারের অর্ডার হিস্ট্রি, ফোন নম্বর, অ্যাড্রেস এবং অন্যান্য ডেটা বিশ্লেষণ করে ফেক অর্ডার শনাক্ত করে। ৯৫% এর বেশি নির্ভুলতায় ফেক অর্ডার ব্লক করা হয়।",
  },
  {
    q: "কোন কোন কুরিয়ার সার্ভিস সাপোর্ট করে?",
    a: "Steadfast, Pathao, RedX, Paperfly, ECOURIER সহ বাংলাদেশের প্রায় সব জনপ্রিয় কুরিয়ার সার্ভিস ইন্টিগ্রেটেড আছে।",
  },
  {
    q: "আমার ডেটা কি নিরাপদ?",
    a: "অবশ্যই! আমরা এন্ড-টু-এন্ড এনক্রিপশন ব্যবহার করি এবং আপনার ডেটা সিকিউর সার্ভারে সংরক্ষিত থাকে।",
  },
  {
    q: "কিভাবে সাপোর্ট পাবো?",
    a: "আমাদের ২৪/৭ লাইভ চ্যাট সাপোর্ট আছে। এছাড়াও ইমেইল, ফোন এবং WhatsApp এ যোগাযোগ করতে পারবেন।",
  },
  {
    q: "ওয়েবসাইট বিল্ডার কি সব প্ল্যানে আছে?",
    a: "বেসিক ওয়েবসাইট বিল্ডার ফ্রি প্ল্যানেও আছে। তবে কাস্টম ডোমেইন, অ্যাডভান্সড টেমপ্লেট এবং SEO ফিচার পেইড প্ল্যানে পাওয়া যায়।",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">সচরাচর জিজ্ঞাসা</h2>
          <p className="mt-3 text-muted-foreground">আপনার সাধারণ প্রশ্নের উত্তর</p>
        </div>

        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
