-- =============================================================
-- GoMiGooo! Seed Data
-- Run AFTER setup-db.sql
-- =============================================================

-- ================================================================
-- DESTINATIONS
-- ================================================================
insert into public.destinations (name, state, description, lat, lng, is_featured) values
('The Nilgiris', 'Tamil Nadu', 'The Blue Mountains — a UNESCO Biosphere Reserve with rolling tea gardens, misty hills, and the famous Nilgiri Mountain Railway.', 11.4102, 76.6950, true),
('Ooty (Udhagamandalam)', 'Tamil Nadu', 'The "Queen of Hill Stations" — charming colonial bungalows, Botanical Gardens, and breathtaking views at 2240m altitude.', 11.4064, 76.6932, true),
('Kodaikanal', 'Tamil Nadu', 'The Princess of Hill Stations — stunning lake, pine forests, and cool misty air in the Palani Hills.', 10.2381, 77.4892, true),
('Munnar', 'Kerala', 'A postcard-perfect destination with endless tea estates, Eravikulam National Park, and the highest peaks in South India.', 10.0889, 77.0595, true),
('Coorg (Kodagu)', 'Karnataka', 'Scotland of India — lush coffee plantations, cascading waterfalls, and warm Kodava hospitality.', 12.3375, 75.8069, true)
on conflict do nothing;

-- ================================================================
-- PLATFORM SETTINGS (Default values — editable from Admin UI)
-- ================================================================
insert into public.platform_settings (key, value, sensitive, category, label, description) values

-- Payment Settings
('razorpay_key_id', '', false, 'payments', 'Razorpay Key ID', 'Your Razorpay API key ID (starts with rzp_)'),
('razorpay_key_secret', '', true, 'payments', 'Razorpay Key Secret', 'Your Razorpay API secret key (keep this confidential)'),
('razorpay_webhook_secret', '', true, 'payments', 'Razorpay Webhook Secret', 'Used to verify webhook signatures from Razorpay'),
('upi_merchant_vpa', '', false, 'payments', 'UPI Merchant VPA', 'Your UPI Virtual Payment Address (e.g., gomigoo@upi)'),
('razorpay_test_mode', 'true', false, 'payments', 'Test Mode', 'Use test keys instead of live keys (set false for production)'),

-- Email Settings
('resend_api_key', '', true, 'email', 'Resend API Key', 'Your Resend.com API key for sending emails'),
('resend_from_email', 'noreply@gomigoo.in', false, 'email', 'From Email Address', 'The email address GoMiGooo! sends from'),
('resend_from_name', 'GoMiGooo!', false, 'email', 'From Name', 'The display name on outgoing emails'),

-- AI Settings
('anthropic_api_key', '', true, 'ai', 'Anthropic API Key', 'Claude API key for AI-powered features (keep confidential)'),
('feature_ai_descriptions', 'true', false, 'ai', 'AI Listing Descriptions', 'Enable AI-generated descriptions for listings (uses Claude Haiku)'),
('feature_photo_moderation', 'true', false, 'ai', 'AI Photo Moderation', 'Flag suspicious customer photos using AI'),
('feature_trip_planner', 'true', false, 'ai', 'AI Trip Planner', 'Enable the AI trip planning chatbot for travelers'),

-- Site Content
('hero_headline', 'Discover India. Directly.', false, 'content', 'Hero Headline', 'Main headline on the landing page hero section'),
('hero_subheadline', 'Book authentic stays, local guides & cabs — zero commission, pure experience', false, 'content', 'Hero Subheadline', 'Subheadline text on the landing page'),
('hero_bg_url', 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1920', false, 'content', 'Hero Background Image URL', 'URL of the hero background image (Nilgiris/hill station photo)'),
('stats_properties', '500', false, 'content', 'Stats: Properties Count', 'Number shown in the animated stats counter'),
('stats_guides', '200', false, 'content', 'Stats: Guides Count', 'Number of guides shown in stats'),
('stats_destinations', '50', false, 'content', 'Stats: Destinations Count', 'Number of destinations shown in stats'),
('testimonials_json', '[{"name":"Priya Sharma","location":"Chennai","rating":5,"text":"Found an amazing cottage in Coonoor through GoMiGooo! The owner was so responsive and the place was exactly as described. No booking fees!","avatar":"PS"},{"name":"Rahul Nair","location":"Bangalore","rating":5,"text":"The zero-commission model means owners actually care — they gave us personalized service we''ve never got from big booking sites.","avatar":"RN"},{"name":"Meera Krishnan","location":"Hyderabad","rating":5,"text":"Our guide Suresh knew every hidden trail in the Nilgiris. Booked directly through GoMiGooo! and saved 20% compared to other platforms.","avatar":"MK"}]', false, 'content', 'Testimonials', 'JSON array of testimonials shown on landing page'),

-- Subscription Pricing
('plan_starter_price', '299', false, 'pricing', 'Starter Plan Price (₹/month)', 'Monthly price for the Starter subscription plan'),
('plan_pro_price', '599', false, 'pricing', 'Pro Plan Price (₹/month)', 'Monthly price for the Pro subscription plan'),
('plan_premium_price', '999', false, 'pricing', 'Premium Plan Price (₹/month)', 'Monthly price for the Premium subscription plan'),
('plan_starter_features', '["1 listing","Up to 10 photos","Basic booking management","Direct customer calls","Verified listing badge"]', false, 'pricing', 'Starter Plan Features', 'JSON array of features for Starter plan'),
('plan_pro_features', '["Up to 3 listings","Up to 30 photos","Booking calendar","Revenue tracker","Priority in search","Analytics dashboard","Call tracking"]', false, 'pricing', 'Pro Plan Features', 'JSON array of features for Pro plan'),
('plan_premium_features', '["Unlimited listings","Unlimited photos","AI listing descriptions","Full analytics","Top placement","Booking notifications","AI photo moderation","Dedicated support"]', false, 'pricing', 'Premium Plan Features', 'JSON array of features for Premium plan'),

-- Feature Flags
('feature_new_registrations', 'true', false, 'features', 'Allow New Registrations', 'Toggle to pause new user sign-ups'),
('feature_online_booking', 'true', false, 'features', 'Online Booking with Payment', 'Enable Razorpay advance booking (disable to show call-only mode)'),
('feature_upi_payment', 'true', false, 'features', 'UPI Payment Option', 'Show UPI as payment option in checkout'),
('advance_payment_percent', '20', false, 'features', 'Advance Payment %', 'Percentage of total amount collected as advance (default: 20%)')

on conflict (key) do nothing;
