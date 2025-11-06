import { NextRequest, NextResponse } from 'next/server'
import { getMessages, updatePane, deletePane } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getMessages()
    const pane = data.panes.find(p => p.id === params.id)
    
    if (!pane) {
      return NextResponse.json({ error: 'Pane not found' }, { status: 404 })
    }
    
    return NextResponse.json(pane)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load pane' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const pane = await updatePane(params.id, body)
    
    if (!pane) {
      return NextResponse.json({ error: 'Pane not found' }, { status: 404 })
    }
    
    return NextResponse.json(pane)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update pane' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deletePane(params.id)
    
    if (!success) {
      return NextResponse.json({ error: 'Pane not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete pane' }, { status: 500 })
  }
}
