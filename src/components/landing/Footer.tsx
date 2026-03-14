const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-gradient-to-b from-secondary/20 to-secondary/40 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold shadow-lg shadow-primary/25">
                Q
              </div>
              <span className="text-lg font-bold text-foreground">
                QUICK SHOP <span className="text-primary">BD</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              বাংলাদেশের প্রথম AI-পাওয়ার্ড ই-কমার্স ম্যানেজমেন্ট প্ল্যাটফর্ম।
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">প্রোডাক্ট</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#features" className="transition-colors hover:text-primary">ফিচারসমূহ</a></li>
              <li><a href="#pricing" className="transition-colors hover:text-primary">প্রাইসিং</a></li>
              <li><a href="#ai-automation" className="transition-colors hover:text-primary">AI অটোমেশন</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">কোম্পানি</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="transition-colors hover:text-primary">আমাদের সম্পর্কে</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">ব্লগ</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">যোগাযোগ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-foreground">সাপোর্ট</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#faq" className="transition-colors hover:text-primary">FAQ</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">হেল্প সেন্টার</a></li>
              <li><a href="#" className="transition-colors hover:text-primary">প্রাইভেসি পলিসি</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
          © 2026 QUICK SHOP BD — সকল অধিকার সংরক্ষিত
        </div>
      </div>
    </footer>
  );
};

export default Footer;
