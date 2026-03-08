const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary/30 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">S</div>
              <span className="text-lg font-bold text-foreground">QUICK SHOP BD</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              বাংলাদেশের প্রথম AI-পাওয়ার্ড ই-কমার্স ম্যানেজমেন্ট প্ল্যাটফর্ম।
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-foreground">প্রোডাক্ট</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">ফিচারসমূহ</a></li>
              <li><a href="#pricing" className="hover:text-foreground">প্রাইসিং</a></li>
              <li><a href="#ai-automation" className="hover:text-foreground">AI অটোমেশন</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-foreground">কোম্পানি</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">আমাদের সম্পর্কে</a></li>
              <li><a href="#" className="hover:text-foreground">ব্লগ</a></li>
              <li><a href="#" className="hover:text-foreground">যোগাযোগ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-foreground">সাপোর্ট</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground">হেল্প সেন্টার</a></li>
              <li><a href="#" className="hover:text-foreground">প্রাইভেসি পলিসি</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © 2026 SOHOZ PRO — সকল অধিকার সংরক্ষিত
        </div>
      </div>
    </footer>
  );
};

export default Footer;
