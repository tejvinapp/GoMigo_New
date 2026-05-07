export type UserRole = 'customer' | 'hotel_owner' | 'cab_owner' | 'guide' | 'shop_owner' | 'admin'
export type PropertyType = 'hotel' | 'cottage' | 'homestay' | 'resort' | 'camping'
export type PropertyStatus = 'pending' | 'active' | 'suspended' | 'deleted'
export type BookingStatus = 'pending' | 'advance_paid' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'refunded'
export type SubscriptionPlan = 'starter' | 'pro' | 'premium'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial'
export type SettingCategory = 'payments' | 'email' | 'ai' | 'content' | 'features' | 'pricing'
export type NotificationType = 'booking' | 'message' | 'review' | 'subscription' | 'system'

export interface User {
  id: string
  email: string
  phone: string | null
  name: string | null
  avatar_url: string | null
  role: UserRole
  kyc_verified: boolean
  onboarding_done: boolean
  created_at: string
  updated_at: string
}

export interface PlatformSetting {
  key: string
  value: string | null
  sensitive: boolean
  category: SettingCategory
  label: string
  description: string | null
  updated_at: string
  updated_by: string | null
}

export interface Destination {
  id: string
  name: string
  state: string
  description: string | null
  cover_image: string | null
  lat: number
  lng: number
  property_count: number
  is_featured: boolean
  created_at: string
}

export interface Property {
  id: string
  owner_id: string
  type: PropertyType
  title: string
  description: string | null
  ai_description: string | null
  price_per_night: number
  location: string
  lat: number
  lng: number
  city: string
  state: string
  amenities: string[]
  max_guests: number
  bedrooms: number
  bathrooms: number
  rating: number
  review_count: number
  status: PropertyStatus
  cover_image: string | null
  phone: string | null
  destination_id: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  id: string
  property_id: string
  url: string
  is_official: boolean
  disputed: boolean
  sort_order: number
  created_at: string
}

export interface Booking {
  id: string
  property_id: string
  customer_id: string
  check_in: string
  check_out: string
  guests: number
  total_amount: number
  advance_paid: number
  balance_due: number
  nights: number
  payment_method: 'card' | 'netbanking' | 'upi' | 'wallet' | null
  status: BookingStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  special_requests: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string
  property_id: string
  reviewer_id: string
  overall_rating: number
  cleanliness_rating: number | null
  accuracy_rating: number | null
  location_rating: number | null
  value_rating: number | null
  comment: string | null
  owner_reply: string | null
  verified_stay: boolean
  created_at: string
}

export interface Guide {
  id: string
  user_id: string
  specialties: string[]
  languages: string[]
  experience_years: number
  price_per_day: number
  bio: string | null
  certifications: string[]
  rating: number
  created_at: string
}

export interface Cab {
  id: string
  owner_id: string
  vehicle_type: string
  seats: number
  has_ac: boolean
  price_per_km: number
  price_per_day: number
  registration_number: string
  created_at: string
}

export interface Shop {
  id: string
  owner_id: string
  shop_type: string
  name: string
  description: string | null
  lat: number
  lng: number
  city: string
  hours: string | null
  created_at: string
}

export interface Subscription {
  id: string
  owner_id: string
  plan: SubscriptionPlan
  amount: number
  status: SubscriptionStatus
  razorpay_subscription_id: string | null
  current_period_end: string | null
  created_at: string
}

export interface Favorite {
  user_id: string
  property_id: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  property_id: string | null
  content: string
  read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

type TableDef<R> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: [] }

// Supabase Database type for createClient generic
export interface Database {
  public: {
    Tables: {
      users: TableDef<User>
      platform_settings: TableDef<PlatformSetting>
      destinations: TableDef<Destination>
      properties: TableDef<Property>
      property_images: TableDef<PropertyImage>
      bookings: TableDef<Booking>
      reviews: TableDef<Review>
      guides: TableDef<Guide>
      cabs: TableDef<Cab>
      shops: TableDef<Shop>
      subscriptions: TableDef<Subscription>
      favorites: TableDef<Favorite>
      messages: TableDef<Message>
      notifications: TableDef<Notification>
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
