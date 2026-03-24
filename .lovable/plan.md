

# Delivery Rider সিস্টেম তৈরির পরিকল্পনা

## সারসংক্ষেপ
নতুন `delivery_rider` রোল তৈরি করা হবে যার মাধ্যমে রাইডাররা শুধুমাত্র `hand_delivery` স্ট্যাটাসের অর্ডারগুলো দেখতে ও ম্যানেজ করতে পারবে। রাইডারের নিজস্ব ড্যাশবোর্ড থাকবে যেখানে ডেলিভারি পরিসংখ্যান, কমিশন হিসাব এবং দিন/মাস/বছর ভিত্তিক রিপোর্ট দেখা যাবে।

---

## ধাপ ১: ডাটাবেস পরিবর্তন (Migration)

### ১.১ নতুন রোল যোগ
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery_rider';
```

### ১.২ `delivery_assignments` টেবিল তৈরি
রাইডারদের কাছে অর্ডার অ্যাসাইন করার জন্য:
- `id`, `order_id`, `rider_id` (user ref), `assigned_by`, `assigned_at`
- `status` (assigned / delivered / returned)
- `delivered_at`, `returned_at`, `return_reason`
- `commission_amount` (রাইডারের কমিশন)
- `collected_amount` (কাস্টমার থেকে সংগ্রহিত টাকা)

### ১.৩ `rider_settings` টেবিল
- `id`, `commission_per_delivery` (ডিফল্ট কমিশন রেট), `updated_at`
- অ্যাডমিন থেকে কন্ট্রোলযোগ্য

### ১.৪ RLS পলিসি
- রাইডাররা শুধু নিজের `delivery_assignments` দেখতে ও আপডেট করতে পারবে
- রাইডাররা `hand_delivery` স্ট্যাটাসের অর্ডার READ করতে পারবে
- অ্যাডমিন সব ম্যানেজ করতে পারবে

### ১.৫ নতুন পারমিশন যোগ
```sql
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_delivery_assignments';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_delivery_assignments';
```

---

## ধাপ ২: ফ্রন্টএন্ড - AuthContext ও রোল আপডেট

- `AppRole` টাইপে `"delivery_rider"` যোগ
- `ROLE_DISPLAY_NAMES`-এ `delivery_rider: "Delivery Rider"` যোগ
- `PermissionKey`-তে `"view_delivery_assignments" | "manage_delivery_assignments"` যোগ

---

## ধাপ ৩: Delivery Rider ড্যাশবোর্ড (`RiderDashboard.tsx`)

### ৩.১ ড্যাশবোর্ড ওভারভিউ
- **স্ট্যাটাস কার্ড:** আজকের ডেলিভারি, পেন্ডিং, রিটার্ন, মোট কমিশন
- **টাইম ফিল্টার:** Today, This Week, This Month, This Year
- **Day-by-day টেবিল:** তারিখ, ডেলিভারি সংখ্যা, সংগ্রহিত টাকা, কমিশন, কোম্পানিকে দেওয়া টাকা

### ৩.২ অর্ডার লিস্ট
- শুধু রাইডারের কাছে অ্যাসাইন করা `hand_delivery` অর্ডার দেখাবে
- প্রতিটি অর্ডারে দুটি অ্যাকশন বাটন: **"Delivered"** ও **"Return"**
- Return ক্লিক করলে কারণ লেখার ফিল্ড আসবে (mandatory)
- Delivered করলে `collected_amount` ইনপুট নেওয়া হবে

### ৩.৩ হিসাব লজিক
- `কমিশন = commission_per_delivery × delivered_count`
- `কোম্পানিকে দেওয়া = collected_amount - commission`

---

## ধাপ ৪: অ্যাডমিন প্যানেল আপডেট

### ৪.১ অর্ডার পেজে রাইডার অ্যাসাইন
- `hand_delivery` স্ট্যাটাসের অর্ডারে "Assign Rider" বাটন যোগ
- ড্রপডাউনে শুধু `delivery_rider` রোলধারী ইউজার দেখাবে
- বাল্ক অ্যাসাইন সাপোর্ট

### ৪.২ অ্যাডমিন Rider ম্যানেজমেন্ট পেজ
- সাইডবারে "Delivery Riders" লিংক (Courier সেকশনের নিচে)
- রাইডারদের তালিকা, তাদের ডেলিভারি পারফরম্যান্স
- কমিশন রেট সেটিং
- Day-by-day রিপোর্ট ভিউ (ফিল্টার: রাইডার, তারিখ)
- রাইডারের সংগ্রহিত টাকা ও কোম্পানিকে জমা দেওয়ার ট্র্যাকিং

### ৪.৩ Users পেজ আপডেট
- রোল ফিল্টারে `delivery_rider` যোগ
- নতুন ইউজার তৈরিতে `delivery_rider` রোল অপশন

---

## ধাপ ৫: রাউটিং ও নেভিগেশন

- `/admin/rider` → Rider Dashboard (rider নিজে দেখবে)
- `/admin/delivery-riders` → Admin Rider Management
- সাইডবারে রাইডারদের জন্য শুধু Dashboard ও Orders দেখাবে
- লগইনের পর রাইডার `/admin/rider`-এ রিডাইরেক্ট হবে

---

## ফাইল পরিবর্তনের তালিকা

| ফাইল | পরিবর্তন |
|---|---|
| Migration SQL | নতুন টেবিল, রোল, পলিসি |
| `src/contexts/AuthContext.tsx` | রোল ও পারমিশন টাইপ আপডেট |
| `src/lib/adminAccess.ts` | Rider fallback route যোগ |
| `src/components/admin/AdminSidebar.tsx` | Rider মেনু আইটেম |
| `src/components/admin/RiderDashboard.tsx` | **নতুন** - রাইডার ড্যাশবোর্ড |
| `src/pages/admin/AdminRiderManagement.tsx` | **নতুন** - অ্যাডমিন রাইডার ম্যানেজমেন্ট |
| `src/hooks/useDeliveryRider.ts` | **নতুন** - রাইডার ডাটা হুক |
| `src/hooks/useEmployeePermissions.ts` | নতুন পারমিশন যোগ |
| `src/pages/admin/AdminOrders.tsx` | রাইডার অ্যাসাইন UI |
| `src/pages/admin/AdminDashboard.tsx` | Rider রোল চেক |
| `src/pages/admin/AdminUsers.tsx` | Rider রোল ফিল্টার |
| `src/App.tsx` | নতুন রাউট যোগ |

