import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { GoogleGenAI } from '@google/genai'

export async function POST(request) {
  try {
    const { message, session_id, subcategory_scope } = await request.json()

    if (!message || !session_id) {
      return NextResponse.json({ error: 'Message and session_id are required' }, { status: 400 })
    }

    // 1. Fetch all approved documents belonging to the subcategory scope
    let docsContext = ''
    if (subcategory_scope) {
      const { data: docs, error: docError } = await supabaseAdmin
        .from('community_documents')
        .select('title, category, subcategory, summary, file_url')
        .eq('status', 'approved')
        .eq('subcategory', subcategory_scope)

      if (docs && docs.length > 0) {
        docsContext = docs.map(doc => (
          `[Document Title]: ${doc.title}
[Category/Subcategory]: ${doc.category} -> ${doc.subcategory}
[Summary]: ${doc.summary}
[Document URL]: ${doc.file_url}`
        )).join('\n\n')
      }
    }

    // 2. Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      const mockReply = `[AI Chat - Demo Mode] (GEMINI_API_KEY environment variable is not defined).\n\nLocked Context: ${subcategory_scope || 'All legal databases'}\n\nUnder Punjab law, here is a simulated advocate reply to "${message}":\n- Keep notices formally in writing.\n- Refer to local rules for court fees.\n\nDocuments found in scope:\n${docsContext || 'None.'}`

      // Save messages in DB
      await supabaseAdmin.from('chat_messages').insert({
        session_id,
        role: 'user',
        content: message,
        subcategory_scope
      })

      await supabaseAdmin.from('chat_messages').insert({
        session_id,
        role: 'model',
        content: mockReply,
        subcategory_scope
      })

      return new Response(mockReply, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    const ai = new GoogleGenAI({ apiKey })

    // Fetch conversation logs/history
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    const contents = []
    if (history) {
      history.forEach(msg => {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.content }]
        })
      })
    }

    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    })

    const systemInstruction = `You are an elite, practical high court advocate in Lahore, Punjab. Answer the user's question accurately.
You MUST base your answers strictly on the attached legal documents. Cite the specific sections, rules, or document titles used.
If the answer cannot be found in the provided files, politely inform the user.

Attached Legal Documents for reference (grounding context):
${docsContext || 'No specific document context provided.'}`

    // Call streaming API
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction
      }
    })

    // Save user message to database
    await supabaseAdmin.from('chat_messages').insert({
      session_id,
      role: 'user',
      content: message,
      subcategory_scope
    })

    let responseText = ''
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const chunkText = chunk.text
            responseText += chunkText
            controller.enqueue(new TextEncoder().encode(chunkText))
          }

          // Save model response to database
          await supabaseAdmin.from('chat_messages').insert({
            session_id,
            role: 'model',
            content: responseText,
            subcategory_scope
          })

          controller.close()
        } catch (streamErr) {
          controller.error(streamErr)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    })

  } catch (error) {
    console.error('API Chat error:', error)
    return NextResponse.json({ error: 'Internal server error processing chat' }, { status: 500 })
  }
}
