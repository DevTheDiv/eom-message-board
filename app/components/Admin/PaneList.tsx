'use client'

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Edit2, Trash2, GripVertical } from 'lucide-react'

export function PaneList({ panes, onEdit, onDelete, onReorder }: any) {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items: any[] = Array.from(panes)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onReorder(items.map(p => p.id))
  }

  if (panes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg">No panes yet. Create your first pane to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Message Panes</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="panes">
          {(provided: any) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {panes.map((pane: any, index: number) => (
                <Draggable key={pane.id} draggableId={pane.id} index={index}>
                  {(provided: any, snapshot: any) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-gray-50 rounded-lg p-4 flex items-center gap-4 ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                    >
                      <div {...provided.dragHandleProps} className="cursor-move">
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{pane.title || 'Untitled'}</h3>
                        <p className="text-sm text-gray-500">Duration: {pane.duration}s • Order: {index + 1}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => onEdit(pane)} className="p-2 hover:bg-gray-200 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(pane.id)} className="p-2 hover:bg-red-100 rounded text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
