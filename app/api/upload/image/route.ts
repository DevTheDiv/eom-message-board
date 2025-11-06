import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const filename = `${uuidv4()}_${file.name}`
    const path = join(process.cwd(), 'public', 'uploads', filename)
    
    await writeFile(path, buffer)
    
    return NextResponse.json({ 
      success: true,
      url: `/uploads/${filename}`,
      filename
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
