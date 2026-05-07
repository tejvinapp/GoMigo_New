const settings = [
  // HERO SECTION
  { key: 'landing_hero_kicker', value: 'Zero commission · 100% authentic', category: 'landing-hero', label: 'Hero Kicker (Small Tag)', description: 'Small text shown above the headline' },
  { key: 'landing_hero_headline', value: 'Discover India.\nDirectly.', category: 'landing-hero', label: 'Hero Headline', description: 'Main hero headline (use \\n for new lines)' },
  { key: 'landing_hero_subheadline', value: 'Book authentic stays, local guides & cabs across India — connecting you directly with hosts who care. Starting with The Nilgiris.', category: 'landing-hero', label: 'Hero Subheadline', description: 'Supporting text below the headline' },
  { key: 'landing_hero_bg_image', value: 'https://images.unsplash.com/photo-1599661046827-9a64bd68a8da?w=2400&q=80', category: 'landing-hero', label: 'Hero Background Image URL', description: 'Full-bleed hero image (1920x1080+)' },
  { key: 'landing_hero_cta_primary', value: 'Explore Stays', category: 'landing-hero', label: 'Primary CTA Text', description: 'Main button text' },
  { key: 'landing_hero_cta_primary_link', value: '/explore', category: 'landing-hero', label: 'Primary CTA Link', description: 'Where the main button goes' },
  { key: 'landing_hero_cta_secondary', value: 'Plan My Trip', category: 'landing-hero', label: 'Secondary CTA Text', description: 'Secondary outline button text' },
  { key: 'landing_hero_cta_secondary_link', value: '/explore?tripPlanner=1', category: 'landing-hero', label: 'Secondary CTA Link', description: 'Where the secondary button goes' },
  { key: 'landing_hero_show_search', value: 'true', category: 'landing-hero', label: 'Show Search Bar in Hero', description: 'Display the floating search bar' },

  // STATS BAR
  { key: 'landing_stats_show', value: 'true', category: 'landing-stats', label: 'Show Stats Bar', description: 'Display the animated stat counters' },
  { key: 'landing_stat1_value', value: '500', category: 'landing-stats', label: 'Stat 1 Value', description: 'First number (will animate up to this)' },
  { key: 'landing_stat1_suffix', value: '+', category: 'landing-stats', label: 'Stat 1 Suffix', description: 'e.g. +, k, %' },
  { key: 'landing_stat1_label', value: 'Authentic Stays', category: 'landing-stats', label: 'Stat 1 Label', description: 'What this number represents' },
  { key: 'landing_stat2_value', value: '50', category: 'landing-stats', label: 'Stat 2 Value', description: '' },
  { key: 'landing_stat2_suffix', value: '+', category: 'landing-stats', label: 'Stat 2 Suffix', description: '' },
  { key: 'landing_stat2_label', value: 'Local Guides', category: 'landing-stats', label: 'Stat 2 Label', description: '' },
  { key: 'landing_stat3_value', value: '5', category: 'landing-stats', label: 'Stat 3 Value', description: '' },
  { key: 'landing_stat3_suffix', value: '', category: 'landing-stats', label: 'Stat 3 Suffix', description: '' },
  { key: 'landing_stat3_label', value: 'Hill Destinations', category: 'landing-stats', label: 'Stat 3 Label', description: '' },

  // HOW IT WORKS
  { key: 'landing_how_show', value: 'true', category: 'landing-how', label: 'Show How It Works Section', description: 'Display the 3-step explainer' },
  { key: 'landing_how_title', value: 'How GoMiGooo! works', category: 'landing-how', label: 'Section Title', description: '' },
  { key: 'landing_how_subtitle', value: 'Three simple steps to your next adventure', category: 'landing-how', label: 'Section Subtitle', description: '' },
  { key: 'landing_how_step1_title', value: 'Discover', category: 'landing-how', label: 'Step 1 Title', description: '' },
  { key: 'landing_how_step1_desc', value: 'Browse curated stays, guides, and experiences across India\'s most beautiful destinations.', category: 'landing-how', label: 'Step 1 Description', description: '' },
  { key: 'landing_how_step2_title', value: 'Connect', category: 'landing-how', label: 'Step 2 Title', description: '' },
  { key: 'landing_how_step2_desc', value: 'Talk directly to property owners and guides — no middlemen, no inflated prices.', category: 'landing-how', label: 'Step 2 Description', description: '' },
  { key: 'landing_how_step3_title', value: 'Experience', category: 'landing-how', label: 'Step 3 Title', description: '' },
  { key: 'landing_how_step3_desc', value: 'Pay just 20% advance, the rest on arrival. Authentic experiences, fairly priced.', category: 'landing-how', label: 'Step 3 Description', description: '' },

  // DESTINATIONS
  { key: 'landing_destinations_show', value: 'true', category: 'landing-destinations', label: 'Show Destinations Section', description: 'Display the destination cards' },
  { key: 'landing_destinations_title', value: 'Explore Top Destinations', category: 'landing-destinations', label: 'Section Title', description: '' },
  { key: 'landing_destinations_subtitle', value: 'Hand-picked hill stations and heritage towns waiting to be discovered', category: 'landing-destinations', label: 'Section Subtitle', description: '' },

  // WHY GOMIGOOO (replaces owner CTA — now traveler-focused)
  { key: 'landing_why_show', value: 'true', category: 'landing-why', label: 'Show "Why" Section', description: 'Display the value proposition' },
  { key: 'landing_why_title', value: 'Why travelers love GoMiGooo!', category: 'landing-why', label: 'Section Title', description: '' },
  { key: 'landing_why_subtitle', value: 'Real experiences, real value, real connections', category: 'landing-why', label: 'Section Subtitle', description: '' },
  { key: 'landing_why_point1_title', value: 'Zero booking fees', category: 'landing-why', label: 'Point 1 Title', description: '' },
  { key: 'landing_why_point1_desc', value: 'You pay what the host charges — not a rupee more. Other platforms add 15-30% in fees.', category: 'landing-why', label: 'Point 1 Description', description: '' },
  { key: 'landing_why_point2_title', value: 'Talk directly to hosts', category: 'landing-why', label: 'Point 2 Title', description: '' },
  { key: 'landing_why_point2_desc', value: 'WhatsApp, call, or message — your host\'s real number is right there. Get local tips, not call-center scripts.', category: 'landing-why', label: 'Point 2 Description', description: '' },
  { key: 'landing_why_point3_title', value: 'Verified, locally owned', category: 'landing-why', label: 'Point 3 Title', description: '' },
  { key: 'landing_why_point3_desc', value: 'Every property is owned by a real local. KYC verified. Photos checked. Reviews from real guests.', category: 'landing-why', label: 'Point 3 Description', description: '' },
  { key: 'landing_why_point4_title', value: 'Pay just 20% upfront', category: 'landing-why', label: 'Point 4 Title', description: '' },
  { key: 'landing_why_point4_desc', value: 'Lock in your dates with a small advance. Pay the rest when you arrive — UPI, card, or cash.', category: 'landing-why', label: 'Point 4 Description', description: '' },

  // TESTIMONIALS
  { key: 'landing_testimonials_show', value: 'true', category: 'landing-testimonials', label: 'Show Testimonials', description: '' },
  { key: 'landing_testimonials_title', value: 'Travelers love what they find', category: 'landing-testimonials', label: 'Section Title', description: '' },

  // FINAL CTA
  { key: 'landing_finalcta_show', value: 'true', category: 'landing-finalcta', label: 'Show Final CTA Section', description: '' },
  { key: 'landing_finalcta_title', value: 'Ready to discover the real India?', category: 'landing-finalcta', label: 'Final CTA Title', description: '' },
  { key: 'landing_finalcta_subtitle', value: 'Join thousands of travelers booking authentic stays directly with local hosts.', category: 'landing-finalcta', label: 'Final CTA Subtitle', description: '' },
  { key: 'landing_finalcta_button', value: 'Start Exploring', category: 'landing-finalcta', label: 'Final CTA Button Text', description: '' },
  { key: 'landing_finalcta_button_link', value: '/explore', category: 'landing-finalcta', label: 'Final CTA Button Link', description: '' },

  // FOOTER
  { key: 'landing_footer_about', value: 'India\'s zero-commission tourism marketplace. Connecting travelers with authentic local experiences across hill stations and heritage towns.', category: 'landing-footer', label: 'Footer About Text', description: 'Short paragraph in the footer left column' },
  { key: 'landing_footer_explore_links', value: '[{"label":"Destinations","href":"/explore"},{"label":"Hotels & Cottages","href":"/explore?type=hotel"},{"label":"Tour Guides","href":"/explore?type=guide"},{"label":"Local Shops","href":"/explore?type=shop"}]', category: 'landing-footer', label: 'Explore Links (JSON)', description: 'JSON array of {label, href}' },
  { key: 'landing_footer_company_links', value: '[{"label":"About Us","href":"/about"},{"label":"Contact","href":"/contact"},{"label":"Become a Vendor","href":"/become-vendor"},{"label":"Press","href":"/press"}]', category: 'landing-footer', label: 'Company Links (JSON)', description: 'JSON array of {label, href}' },
  { key: 'landing_footer_legal_links', value: '[{"label":"Terms","href":"/terms"},{"label":"Privacy","href":"/privacy"},{"label":"Cookies","href":"/cookies"},{"label":"Refund Policy","href":"/refund"}]', category: 'landing-footer', label: 'Legal Links (JSON)', description: 'JSON array of {label, href}' },
  { key: 'landing_footer_copyright', value: '© 2026 GoMiGooo! · Made with care in The Nilgiris', category: 'landing-footer', label: 'Footer Copyright Text', description: 'Bottom-most line' },

  // VENDOR INVITE STRIP (small banner inviting users to become vendors, NOT a hero CTA)
  { key: 'landing_vendor_strip_show', value: 'true', category: 'landing-vendor-strip', label: 'Show Vendor Invite Strip', description: 'Small banner at the bottom inviting people to list their property/service' },
  { key: 'landing_vendor_strip_text', value: 'Own a property, run a homestay, drive a cab, or guide tours?', category: 'landing-vendor-strip', label: 'Strip Text', description: 'Body text of the strip' },
  { key: 'landing_vendor_strip_cta', value: 'Join as a Vendor →', category: 'landing-vendor-strip', label: 'Strip CTA Text', description: 'Link text' },
  { key: 'landing_vendor_strip_link', value: '/become-vendor', category: 'landing-vendor-strip', label: 'Strip CTA Link', description: '' },
]

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
if (!TOKEN) { console.error('Set SUPABASE_ACCESS_TOKEN'); process.exit(1) }
const REF = process.env.SUPABASE_PROJECT_REF || 'oerbizamycrbgnufeylq'

function esc(v) { return String(v).replace(/'/g, "''") }

;(async () => {
  const values = settings.map(s =>
    `('${esc(s.key)}', '${esc(s.value)}', false, '${s.category}', '${esc(s.label)}', '${esc(s.description)}')`
  ).join(',\n')

  const sql = `insert into platform_settings (key, value, sensitive, category, label, description) values ${values} on conflict (key) do update set label = excluded.label, description = excluded.description, category = excluded.category returning key`

  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
  })
  const t = await r.json()
  console.log('Upserted:', Array.isArray(t) ? t.length : 'error', JSON.stringify(t).substring(0, 300))

  const c = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'select count(*)::int as total from platform_settings' })
  }).then(x => x.json())
  console.log('Total settings:', c)
})()
