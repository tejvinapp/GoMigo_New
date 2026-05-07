import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  const { days, interests, budget, destination } = await request.json()

  // Get AI API key from env (edge runtime can't use Supabase easily)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500 })
  }

  const anthropic = new Anthropic({ apiKey })

  const prompt = `You are an expert local travel guide specializing in South Indian hill stations. Create a detailed, practical ${days}-day travel itinerary.

Destination: ${destination || 'The Nilgiris, Tamil Nadu'}
Duration: ${days} days
Interests: ${interests || 'nature, local culture, food'}
Budget: ${budget || 'moderate'} (₹)

Create a day-by-day itinerary that includes:
- Morning, afternoon, and evening activities for each day
- Specific local restaurants for meals (mention local dishes)
- Best viewpoints, treks, and hidden gems
- Practical tips (best time to visit spots, what to wear, local transport)
- Estimated costs in Indian Rupees where relevant

Format each day clearly with headers. Be specific about actual places and distances. Include authentic local experiences that travelers can't find on generic travel sites. End with packing tips and best season advice.`

  const stream = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
