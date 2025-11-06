import { NextRequest, NextResponse } from 'next/server'
import { getMessages, saveMessages } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { paneIds } = await request.json()
    const data = await getMessages()
    
    const reorderedPanes = paneIds.map((id: string, index: number) => {
      const pane = data.panes.find(p => p.id === id)
      if (pane) {
        pane.order = index
      }
      return pane
    }).filter(Boolean)
    
    data.panes = reorderedPanes
    await saveMessages(data)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder panes' }, { status: 500 })
  }
}
