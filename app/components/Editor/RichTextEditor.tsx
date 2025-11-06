'use client'

import dynamic from 'next/dynamic'
import ImageResize from 'quill-image-resize-module-react'
import { forwardRef } from 'react'

// This advanced import wrapper is required to register modules
// that depend on Quill's internal classes.
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill')
    const Quill = RQ.Quill
    
    // @ts-ignore
    Quill.register('modules/imageResize', ImageResize)
    
    // Get the Parchment class Quill uses for formatting
    const Parchment = Quill.import('parchment')

    // 1. Whitelist the 'align' class attribute for block elements
    const AlignClass = Quill.import('formats/align')
    AlignClass.whitelist = ['right', 'center', 'justify']
    Quill.register(AlignClass, true)

    // 2. Whitelist ALL inline style properties we need in ONE place.
    const InlineStyle = new Parchment.Attributor.Style('style', 'style', {
      scope: Parchment.Scope.INLINE,
      whitelist: [
        'float',        // For image alignment
        'width',        // For image resizing
        'height',       // For image resizing
        'color',        // For text color
        'background-color' // For highlights
      ]
    })
    Quill.register(InlineStyle, true);

    // Define the modules object
    const modules = {
      toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        
        // === START OF FIX ===
        // This line adds both the text color and background (highlighter) buttons
        [{ 'color': [] }, { 'background': [] }],
        // === END OF FIX ===
        
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      imageResize: {
        parchment: Parchment,
        modules: ['Resize', 'DisplaySize', 'Toolbar'] // Toolbar adds align buttons (float)
      }
    }
    
    // Forward the ref and pass the modules to the real component
    const QuillWrapper = forwardRef<RQ, any>((props, ref) => (
      <RQ ref={ref} modules={modules} {...props} />
    ))
    
    return QuillWrapper
  },
  { ssr: false } // This module must be client-side only
)

// This default export remains the same
export default function RichTextEditor({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      // Modules are now passed by the wrapper
    />
  )
}