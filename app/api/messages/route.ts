import { NextRequest, NextResponse } from 'next/server'
import { getMessages, createPane } from '@/lib/db'

export async function GET() {
  try {
    const data = await getMessages()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const pane = await createPane(body)
    return NextResponse.json(pane)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create pane' }, { status: 500 })
  }
}
