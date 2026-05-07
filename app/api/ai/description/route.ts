import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { property_id } = await request.json()

  // Verify ownership
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', property_id)
    .eq('owner_id', user.id)
    .single()

  if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  // Get AI API key
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'anthropic_api_key')
    .single()

  const apiKey = process.env.ANTHROPIC_API_KEY || settings?.value
  if (!apiKey) return NextResponse.json({ error: 'AI not configured. Add your Anthropic API key in Admin Settings.' }, { status: 500 })

  const anthropic = new Anthropic({ apiKey })

  const prompt = `You are a professional travel copywriter specializing in Indian tourism. Write a compelling, warm, and authentic property description for GoMiGooo! — a zero-commission Indian tourism marketplace.

Property details:
- Name: ${property.title}
- Type: ${property.type}
- Location: ${property.city}, ${property.state}
- Price: ₹${property.price_per_night}/night
- Max guests: ${property.max_guests}
- Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
- Amenities: ${property.amenities.join(', ') || 'Basic amenities'}
- Owner's description: ${property.description || 'A wonderful property in the hills'}

Write 3-4 paragraphs that:
1. Opens with a vivid, sensory description of the location and atmosphere
2. Describes the property's unique charm and what makes it special
3. Mentions the amenities and what guests can enjoy
4. Closes with what kind of traveler would love this place

Use warm, authentic language. Avoid clichés. Mention specific local context (Indian hill stations, nature, culture). Write in English. Keep it under 350 words.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const description = message.content[0].type === 'text' ? message.content[0].text : ''

    // Save to database
    await supabase.from('properties').update({ ai_description: description }).eq('id', property_id)

    return NextResponse.json({ description })
  } catch {
    return NextResponse.json({ error: 'AI description generation failed' }, { status: 500 })
  }
}
