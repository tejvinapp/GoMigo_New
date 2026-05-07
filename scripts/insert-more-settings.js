const settings = [
  // Branding
  { key: 'brand_logo_url', value: '', sensitive: false, category: 'branding', label: 'Logo URL', description: 'URL to your logo image (PNG/SVG)' },
  { key: 'brand_favicon_url', value: '', sensitive: false, category: 'branding', label: 'Favicon URL', description: 'URL to favicon (32x32 PNG/ICO)' },
  { key: 'brand_primary_color', value: '#1a6b3c', sensitive: false, category: 'branding', label: 'Primary Color', description: 'Main brand color (hex)' },
  { key: 'brand_accent_color', value: '#f5a623', sensitive: false, category: 'branding', label: 'Accent Color', description: 'Accent color for highlights' },
  { key: 'brand_app_name', value: 'GoMiGooo!', sensitive: false, category: 'branding', label: 'App Name', description: 'Shown in headers, page titles, emails' },
  { key: 'brand_tagline', value: 'Discover India. Directly.', sensitive: false, category: 'branding', label: 'Tagline', description: 'Short brand tagline' },
  // SEO
  { key: 'seo_meta_title', value: 'GoMiGooo! — Discover India. Directly.', sensitive: false, category: 'seo', label: 'Default Meta Title', description: 'Default <title> tag for pages' },
  { key: 'seo_meta_description', value: 'Zero-commission Indian tourism marketplace. Book authentic stays, local guides, and cabs in The Nilgiris and beyond.', sensitive: false, category: 'seo', label: 'Default Meta Description', description: 'Default meta description (160 chars max)' },
  { key: 'seo_og_image', value: '', sensitive: false, category: 'seo', label: 'OG Image URL', description: 'Image shown when shared on social media (1200x630)' },
  { key: 'seo_keywords', value: 'India travel, Nilgiris, Ooty, homestay, zero commission', sensitive: false, category: 'seo', label: 'Meta Keywords', description: 'Comma-separated keywords' },
  { key: 'seo_robots', value: 'index,follow', sensitive: false, category: 'seo', label: 'Robots Directive', description: 'e.g. index,follow OR noindex,nofollow' },
  // Analytics
  { key: 'analytics_google_id', value: '', sensitive: false, category: 'analytics', label: 'Google Analytics ID', description: 'GA4 Measurement ID (G-XXXXXXXXXX)' },
  { key: 'analytics_facebook_pixel', value: '', sensitive: false, category: 'analytics', label: 'Facebook Pixel ID', description: 'Meta Pixel for ad tracking' },
  { key: 'analytics_plausible_domain', value: '', sensitive: false, category: 'analytics', label: 'Plausible Domain', description: 'Plausible analytics domain' },
  { key: 'analytics_hotjar_id', value: '', sensitive: false, category: 'analytics', label: 'Hotjar Site ID', description: 'Hotjar tracking ID for heatmaps' },
  // Booking
  { key: 'booking_advance_percent', value: '20', sensitive: false, category: 'booking', label: 'Advance Payment %', description: 'Percentage of total to collect upfront (0-100)' },
  { key: 'booking_min_nights', value: '1', sensitive: false, category: 'booking', label: 'Minimum Nights', description: 'Smallest allowed booking duration' },
  { key: 'booking_max_nights', value: '30', sensitive: false, category: 'booking', label: 'Maximum Nights', description: 'Largest allowed booking duration' },
  { key: 'booking_advance_days', value: '0', sensitive: false, category: 'booking', label: 'Advance Booking Days (Min)', description: 'Min days ahead a booking must be made' },
  { key: 'booking_advance_days_max', value: '365', sensitive: false, category: 'booking', label: 'Advance Booking Days (Max)', description: 'How far in advance bookings allowed' },
  { key: 'booking_cancellation_window', value: '48', sensitive: false, category: 'booking', label: 'Cancellation Window (hours)', description: 'Hours before check-in to allow free cancellation' },
  { key: 'booking_cancellation_policy', value: 'Free cancellation up to 48 hours before check-in. After that, advance payment is non-refundable.', sensitive: false, category: 'booking', label: 'Cancellation Policy Text', description: 'Shown to customers at booking time' },
  { key: 'booking_online_enabled', value: 'true', sensitive: false, category: 'booking', label: 'Enable Online Booking', description: 'Master switch for online booking flow' },
  { key: 'booking_show_upi', value: 'true', sensitive: false, category: 'booking', label: 'Show UPI Option', description: 'Display UPI as a payment method' },
  // Limits
  { key: 'limit_max_listings_per_owner', value: '50', sensitive: false, category: 'limits', label: 'Max Listings per Owner', description: 'How many properties one owner can list' },
  { key: 'limit_max_photos_per_listing', value: '20', sensitive: false, category: 'limits', label: 'Max Photos per Listing', description: 'Photo upload cap per property' },
  { key: 'limit_photo_max_mb', value: '5', sensitive: false, category: 'limits', label: 'Max Photo Size (MB)', description: 'Per-file upload limit' },
  { key: 'limit_kyc_required', value: 'true', sensitive: false, category: 'limits', label: 'Require KYC for Owners', description: 'Block listing creation until KYC verified' },
  { key: 'limit_review_min_chars', value: '20', sensitive: false, category: 'limits', label: 'Min Review Length', description: 'Smallest review comment length' },
  // Notifications
  { key: 'notify_owner_on_booking', value: 'true', sensitive: false, category: 'notifications', label: 'Notify Owner on New Booking', description: 'Email property owner when booking made' },
  { key: 'notify_customer_on_confirm', value: 'true', sensitive: false, category: 'notifications', label: 'Notify Customer on Confirmation', description: 'Send booking confirmation email' },
  { key: 'notify_admin_on_signup', value: 'false', sensitive: false, category: 'notifications', label: 'Notify Admin on New Signup', description: 'Email admin when someone signs up' },
  { key: 'notify_admin_email', value: '', sensitive: false, category: 'notifications', label: 'Admin Notification Email', description: 'Where to send admin alerts' },
  { key: 'notify_subscription_renewal_days', value: '7', sensitive: false, category: 'notifications', label: 'Subscription Renewal Reminder (days before)', description: 'When to remind owners' },
  // Localization
  { key: 'i18n_default_language', value: 'en', sensitive: false, category: 'localization', label: 'Default Language', description: 'ISO code (en, hi, ta, kn)' },
  { key: 'i18n_currency', value: 'INR', sensitive: false, category: 'localization', label: 'Currency Code', description: 'ISO 4217 (INR, USD, EUR, etc.)' },
  { key: 'i18n_currency_symbol', value: '₹', sensitive: false, category: 'localization', label: 'Currency Symbol', description: 'Display symbol' },
  { key: 'i18n_locale', value: 'en-IN', sensitive: false, category: 'localization', label: 'Number Format Locale', description: 'BCP-47 (en-IN, en-US, hi-IN)' },
  { key: 'i18n_timezone', value: 'Asia/Kolkata', sensitive: false, category: 'localization', label: 'Default Timezone', description: 'IANA timezone' },
  // Subscription
  { key: 'sub_trial_days', value: '14', sensitive: false, category: 'subscription', label: 'Free Trial Days', description: 'New owners get this many free days' },
  { key: 'sub_grace_days', value: '7', sensitive: false, category: 'subscription', label: 'Grace Period Days', description: 'Days after expiration before suspension' },
  { key: 'sub_auto_cancel', value: 'true', sensitive: false, category: 'subscription', label: 'Auto-cancel After Grace', description: 'Cancel subscription after grace period' },
  // Legal
  { key: 'legal_terms_url', value: '/terms', sensitive: false, category: 'legal', label: 'Terms of Service URL', description: 'Link to terms page' },
  { key: 'legal_privacy_url', value: '/privacy', sensitive: false, category: 'legal', label: 'Privacy Policy URL', description: 'Link to privacy page' },
  { key: 'legal_cookie_url', value: '/cookies', sensitive: false, category: 'legal', label: 'Cookie Policy URL', description: 'Link to cookie page' },
  { key: 'legal_company_name', value: 'GoMiGooo!', sensitive: false, category: 'legal', label: 'Legal Company Name', description: 'For invoices/footer' },
  { key: 'legal_company_address', value: '', sensitive: false, category: 'legal', label: 'Company Address', description: 'Registered address' },
  { key: 'legal_gstin', value: '', sensitive: false, category: 'legal', label: 'GSTIN', description: 'Indian GST identification number' },
  // Contact
  { key: 'contact_email', value: '', sensitive: false, category: 'contact', label: 'Support Email', description: 'Public-facing support email' },
  { key: 'contact_phone', value: '', sensitive: false, category: 'contact', label: 'Support Phone', description: 'Public support phone' },
  { key: 'contact_whatsapp', value: '', sensitive: false, category: 'contact', label: 'WhatsApp Number', description: 'WhatsApp support number' },
  { key: 'social_instagram', value: '', sensitive: false, category: 'contact', label: 'Instagram URL', description: 'Full URL' },
  { key: 'social_facebook', value: '', sensitive: false, category: 'contact', label: 'Facebook URL', description: 'Full URL' },
  { key: 'social_twitter', value: '', sensitive: false, category: 'contact', label: 'Twitter / X URL', description: 'Full URL' },
  { key: 'social_youtube', value: '', sensitive: false, category: 'contact', label: 'YouTube URL', description: 'Full URL' },
  // Operations
  { key: 'ops_maintenance_mode', value: 'false', sensitive: false, category: 'operations', label: 'Maintenance Mode', description: 'Show maintenance page to all users' },
  { key: 'ops_maintenance_message', value: 'We are doing some quick maintenance. Back in a few minutes!', sensitive: false, category: 'operations', label: 'Maintenance Message', description: 'Shown during maintenance' },
  { key: 'ops_signups_enabled', value: 'true', sensitive: false, category: 'operations', label: 'Allow New Signups', description: 'Disable to pause new registrations' },
  { key: 'ops_owner_signups_enabled', value: 'true', sensitive: false, category: 'operations', label: 'Allow New Owner Signups', description: 'Disable to pause new owner registrations' },
  // SMS
  { key: 'sms_provider', value: 'none', sensitive: false, category: 'sms', label: 'SMS Provider', description: 'none, twilio, msg91, fast2sms' },
  { key: 'sms_api_key', value: '', sensitive: true, category: 'sms', label: 'SMS API Key', description: 'API key for SMS provider' },
  { key: 'sms_sender_id', value: '', sensitive: false, category: 'sms', label: 'SMS Sender ID', description: '6-character sender ID (e.g. GMIGOO)' },
  { key: 'sms_otp_enabled', value: 'false', sensitive: false, category: 'sms', label: 'Enable SMS OTP', description: 'Use SMS OTP for booking verification' },
];

// Run with: SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/insert-more-settings.js
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
if (!TOKEN) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }
const REF = process.env.SUPABASE_PROJECT_REF || 'oerbizamycrbgnufeylq'

function esc(v) { return String(v).replace(/'/g, "''"); }

(async () => {
  const values = settings.map(s =>
    `('${esc(s.key)}', '${esc(s.value)}', ${s.sensitive}, '${s.category}', '${esc(s.label)}', '${esc(s.description)}')`
  ).join(',\n');

  const sql = `insert into platform_settings (key, value, sensitive, category, label, description) values ${values} on conflict (key) do nothing returning key`;

  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  });
  const t = await r.json();
  console.log('Inserted:', Array.isArray(t) ? t.length : 'error');
  console.log('Sample:', JSON.stringify(t).substring(0, 200));

  const c = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'select category, count(*)::int as fields from platform_settings group by category order by category' })
  }).then(x => x.json());
  console.log('\nCategories:');
  console.table(c);
})();
