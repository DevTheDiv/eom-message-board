import { NextRequest, NextResponse } from 'next/server'
import { getMessages, saveMessages } from '@/lib/db'

export async function GET() {
  try {
    const data = await getMessages()
    return NextResponse.json(data.globalSettings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    const data = await getMessages()
    
    data.globalSettings = {
      ...data.globalSettings,
      ...settings
    }
    
    await saveMessages(data)
    
    return NextResponse.json(data.globalSettings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
