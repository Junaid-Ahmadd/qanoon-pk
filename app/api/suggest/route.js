import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { section, suggestion, topicSlug } = body

    console.log(`[Correction Suggestion] Topic: ${topicSlug}, Section: ${section}, Content: ${suggestion}`)

    // Here you would typically write to a database or Sanity if configured
    return NextResponse.json({
      success: true,
      message: 'Correction suggestion submitted successfully. Thank you!'
    })
  } catch (error) {
    console.error('Error submitting suggestion:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
