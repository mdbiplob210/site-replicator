

## SOHOZ PRO ক্লোন - Implementation Plan

### যা আমি দেখতে পেয়েছি

**Landing Page (sohozpro.com):**
- Header: Logo + Nav (ফিচারসমূহ, কিভাবে কাজ করে, AI অটোমেশন, প্ল্যান, FAQ) + লগইন + ফ্রি শুরু করুন বাটন
- Hero section: Bangla headline, subtitle, badge pills (ফেক অর্ডার ব্লকিং, AI অটোমেশন, রিয়েল-টাইম প্রফিট, সেটআপ ৩০ সেকেন্ডে)
- Features section: 14 feature cards in a grid
- "কিভাবে কাজ করে" - 5-step process
- AI অটোমেশন section with stats (80%, 95%, 10x)
- অ্যানালিটিক্স ও ট্র্যাকিং section
- রিয়েল-টাইম ড্যাশবোর্ড preview with stats
- ওয়েবসাইট বিল্ডার section
- "কেন SOHOZ PRO" - 8 benefit cards
- FAQ accordion
- CTA footer section

**Login Page (app.sohozpro.com):**
- Centered card on light gray background
- SOHOZ PRO logo + title
- Email + Password inputs (Bangla labels, icons)
- Purple "সাইন ইন" button
- "অথবা" divider
- "Google দিয়ে লগইন" button
- Footer: "© 2026 SOHOZ PRO — Secure & Encrypted"

**Dashboard:** Not visible (behind login wall). Screenshots needed from user.

---

### Plan - Phase 1: Landing Page + Login (what I can build now)

**1. Create Landing Page (`src/pages/Landing.tsx`)**
- Full replica of sohozpro.com with all sections
- Purple/indigo color scheme matching the original
- Responsive design with Tailwind
- Smooth scroll navigation
- FAQ accordion using Radix accordion component
- Stats counters and feature cards
- Bangla text throughout

**2. Create Login Page (`src/pages/Login.tsx`)**
- Centered card layout on light gray bg
- Email + password form with Bangla labels and icons
- Purple gradient submit button
- Google login button (UI only, no actual auth)
- Footer text

**3. Create shared components:**
- `src/components/landing/Header.tsx` - Nav bar with logo
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/FeaturesSection.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/AISection.tsx`
- `src/components/landing/AnalyticsSection.tsx`
- `src/components/landing/DashboardPreview.tsx`
- `src/components/landing/WebsiteBuilder.tsx`
- `src/components/landing/WhyChoose.tsx`
- `src/components/landing/FAQSection.tsx`
- `src/components/landing/CTASection.tsx`
- `src/components/landing/Footer.tsx`

**4. Update routing (`src/App.tsx`)**
- `/` -> Landing page
- `/login` -> Login page

---

### Important Note

ড্যাশবোর্ড (লগইন করার পরের পেজগুলো) বানাতে হলে আপনাকে স্ক্রিনশট দিতে হবে। আমি বাইরের সাইটে লগইন করতে পারি না। অনুগ্রহ করে লগইন করে এই পেজগুলোর স্ক্রিনশট দিন:
- Dashboard/Home page
- Order management page
- Product page
- Settings page
- এবং অন্যান্য গুরুত্বপূর্ণ পেজ

**প্ল্যান অ্যাপ্রুভ করলে আমি Landing Page + Login Page দিয়ে শুরু করব, এরপর স্ক্রিনশট পেলে ড্যাশবোর্ড বানাব।**

