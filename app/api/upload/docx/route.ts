import { NextRequest, NextResponse } from 'next/server'
import { convertDocxToHtml } from '@/lib/word-processor'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const document = formData.get('document') as File | null

    if (!document) {
      return NextResponse.json({ error: 'No document provided' }, { status: 400 })
    }

    // 1. Convert File to ArrayBuffer
    const arrayBuffer = await document.arrayBuffer()

    // === START OF FIX ===
    // 2. Convert ArrayBuffer to Node.js Buffer
    const buffer = Buffer.from(arrayBuffer)
    // === END OF FIX ===

    // 3. Process with Mammoth with improved highlight support
    const { html, messages } = await convertDocxToHtml(buffer)

    // Debug: Log the HTML to see what's being generated
    console.log('Generated HTML:', html.substring(0, 500))
    console.log('Mammoth messages:', messages)

    return NextResponse.json({ html, messages }, { status: 200 })

  } catch (error: any) {
    console.error('Docx conversion error:', error)

    let errorMessage = 'Failed to convert document'
    if (error?.code === 'MODULE_NOT_FOUND') {
      errorMessage = "Server error: 'mammoth' library is not installed."
    } else if (error?.message) {
      errorMessage = error.message
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}