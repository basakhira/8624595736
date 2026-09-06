Jessica-r Website — Setup Guide
================================================

ফাইলগুলো
---------
index.html    -> লাইভ ওয়েবসাইট (visitors দেখবে)
admin.html    -> আপনার Admin Panel (শুধু আপনি ব্যবহার করবেন)
content.json  -> নাম, ফোন, লিংক, গ্যালারির তালিকা — admin panel এটাই আপডেট করে
style.css, script.js       -> মূল সাইটের ডিজাইন ও কোড
admin.css, admin.js        -> admin panel এর ডিজাইন ও কোড
images/       -> ছবিগুলো এখানে জমা হবে (admin panel থেকে অটোমেটিক)

ধাপ ১ — GitHub এ আপলোড করুন
-----------------------------
এই zip এর ভেতরের সবকিছু আগের মতোই "uploading an existing file" দিয়ে
আপনার GitHub রিপোজিটরিতে আপলোড করুন, তারপর Vercel দিয়ে Deploy করুন।
সাইট লাইভ হয়ে গেলে yoursite.vercel.app এ ওয়েবসাইট দেখতে পাবেন এবং
yoursite.vercel.app/admin.html এ Admin Panel পাবেন।

ধাপ ২ — একটা GitHub Token বানান (একবারই লাগবে)
------------------------------------------------
Admin Panel থেকে ছবি/লেখা সেভ করতে হলে একটা "টোকেন" (পাসওয়ার্ডের মতো) লাগবে।
1. এই লিংকে যান: https://github.com/settings/tokens/new
2. "Note" ঘরে লিখুন: website admin
3. "Expiration" এ 90 days বা No expiration যেটা চান সিলেক্ট করুন
4. নিচে "repo" এর পাশের বড় চেকবক্সে টিক দিন (এটা টিক দিলে ভেতরের সবগুলো
   অটো টিক হয়ে যাবে)
5. নিচে "Generate token" বাটনে ক্লিক করুন
6. যে সবুজ/কালো কোডটা (ghp_ দিয়ে শুরু) দেখাবে, সেটা কপি করে রাখুন —
   এই পেজ ছেড়ে গেলে আর দেখতে পারবেন না, তাই কোথাও নোট করে রাখুন।

এই টোকেন একটা পাসওয়ার্ডের মতো — কারো সাথে শেয়ার করবেন না।

ধাপ ৩ — Admin Panel ব্যবহার করুন
----------------------------------
1. yoursite.vercel.app/admin.html এ যান
2. "One-time setup" এ:
   - GitHub username: আপনার GitHub ইউজারনেম (যেমন basakhira)
   - Repository name: আপনার রিপোর নাম (যেমন 8624595736)
   - Branch: main (এমনিতেই লেখা থাকবে)
   - Personal Access Token: ধাপ ২ থেকে কপি করা টোকেনটা পেস্ট করুন
   - "Save setup" চাপুন
3. এরপর:
   - "Site text" এ নাম, ট্যাগলাইন, ফোন নাম্বার, WhatsApp/Instagram/Email
     লিংক বসিয়ে "Save text" চাপুন
   - "Main photo" তে হোমপেজের বড় ছবিটা বাছাই করে "Upload main photo" চাপুন
   - "Gallery photos" এ একসাথে একাধিক ছবি বাছাই করে "Add to gallery" চাপুন
4. প্রতিটা সেভের পর ৩০-৬০ সেকেন্ড অপেক্ষা করে লাইভ সাইট রিফ্রেশ করুন —
   Vercel অটোমেটিক নতুন ভার্সন আপলোড করে দেবে।

নোট
-----
- WhatsApp লিংকের ফরম্যাট: https://wa.me/8801XXXXXXXXX (দেশের কোডসহ, + ছাড়া)
- ছবি বড় সাইজের হলে admin panel নিজে থেকেই ছবি হালকা কমপ্রেস করে আপলোড করে,
  তাই চিন্তা করার দরকার নেই।
- admin.html লিংকটা কাউকে শেয়ার করবেন না, এবং টোকেন অন্য কারো
  কম্পিউটার/ব্রাউজারে বসাবেন না।
- Setup (username/repo/token) এই ব্রাউজারেই সেভ থাকে। অন্য কম্পিউটার/ব্রাউজার
  থেকে খুললে আবার Setup করতে হবে।
