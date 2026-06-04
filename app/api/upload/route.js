import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { GoogleGenAI } from '@google/genai'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // 1. Upload raw file to Supabase legal-documents bucket
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from('legal-documents')
      .upload(filename, buffer, {
        contentType: file.type || 'application/pdf',
        duplex: 'half'
      })

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json({ error: `Failed to upload file to storage: ${storageError.message || JSON.stringify(storageError)}` }, { status: 500 })
    }

    // 2. Get public URL of the uploaded asset
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('legal-documents')
      .getPublicUrl(filename)

    // 3. Create document record with status pending
    const { data: docData, error: dbError } = await supabaseAdmin
      .from('community_documents')
      .insert({
        file_url: publicUrl,
        status: 'pending'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: `Failed to create document record: ${dbError.message || JSON.stringify(dbError)}` }, { status: 500 })
    }

    const docId = docData.id

    // 4. Pass file stream to Gemini API
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Falling back to local auto-approve for testing.')
      // Auto-approve for sandbox testing if API key is not present
      const defaultData = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        category: 'Civil Law',
        subcategory: 'Rental Disputes',
        summary: 'Eviction Notice under Punjab Rent Restriction law (Auto-approved for local test).',
        status: 'approved'
      }

      await supabaseAdmin
        .from('community_documents')
        .update(defaultData)
        .eq('id', docId)

      return NextResponse.json({ success: true, status: 'approved', analysis: defaultData })
    }

    const ai = new GoogleGenAI({ apiKey })

    let analysis
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          `Based ONLY on the legal document file name: "${file.name}", extract a clean title (e.g. removing file extensions, dates, or numbers), determine a high-level category (e.g., Civil Law, Criminal Law, Rental Law, Family Law), and define a hyper-niche subcategory based on that title (e.g., Rental Disputes, Bail Application, Divorce & Khula).
Force response ONLY in clean, structured JSON format:
{ "title": "string", "category": "string", "subcategory": "string" }`
        ],
        config: {
          responseMimeType: 'application/json'
        }
      })

      const resultText = response.text
      analysis = JSON.parse(resultText)
    } catch (apiErr) {
      console.warn('Gemini API quota exceeded or call failed. Using local regex fallback:', apiErr.message || apiErr)
      
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')
      let category = 'Civil Law'
      let subcategory = 'General Documents'

      const lowerName = file.name.toLowerCase()
      if (lowerName.includes('rent') || lowerName.includes('evict') || lowerName.includes('tenant') || lowerName.includes('landlord')) {
        category = 'Civil Law'
        subcategory = 'Rental Disputes'
      } else if (lowerName.includes('divorce') || lowerName.includes('khula') || lowerName.includes('marriage') || lowerName.includes('nikah')) {
        category = 'Family Law'
        subcategory = 'Divorce & Khula'
      } else if (lowerName.includes('bail') || lowerName.includes('fir') || lowerName.includes('police') || lowerName.includes('criminal')) {
        category = 'Criminal Law'
        subcategory = 'Bail Applications'
      }

      analysis = {
        title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
        category,
        subcategory
      }
    }

    // 5. Update row based on approval (All documents are auto-approved)
    await supabaseAdmin
      .from('community_documents')
      .update({
        title: analysis.title || file.name.replace(/\.[^/.]+$/, ""),
        category: analysis.category || 'Civil Law',
        subcategory: analysis.subcategory || 'General',
        summary: 'Document uploaded to directory.',
        status: 'approved'
      })
      .eq('id', docId)

    return NextResponse.json({ success: true, status: 'approved', analysis })

  } catch (error) {
    console.error('API Upload error:', error)
    return NextResponse.json({ error: `Internal server error: ${error.message || JSON.stringify(error)}` }, { status: 500 })
  }
}
