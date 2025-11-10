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

    // 1. Use inline style for alignment instead of classes
    const AlignStyle = new Parchment.Attributor.Style('align', 'text-align', {
      scope: Parchment.Scope.BLOCK,
      whitelist: ['left', 'center', 'right', 'justify']
    })
    Quill.register(AlignStyle, true)

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

    // 2b. Extend Image format to support width and height attributes
    const ImageFormatAttributesList = ['alt', 'height', 'width', 'style']
    const BaseImageFormat = Quill.import('formats/image')
    class ImageFormat extends BaseImageFormat {
      static formats(domNode: HTMLElement) {
        return ImageFormatAttributesList.reduce((formats: any, attribute) => {
          if (domNode.hasAttribute(attribute)) {
            formats[attribute] = domNode.getAttribute(attribute)
          }
          return formats
        }, {})
      }
      format(name: string, value: any) {
        if (ImageFormatAttributesList.indexOf(name) > -1) {
          if (value) {
            this.domNode.setAttribute(name, value)
          } else {
            this.domNode.removeAttribute(name)
          }
        } else {
          super.format(name, value)
        }
      }
    }
    Quill.register(ImageFormat, true)

    // 3. Register custom font sizes (Word-like sizes in points)
    const SizeStyle = Quill.import('attributors/style/size')
    SizeStyle.whitelist = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '22pt', '24pt', '26pt', '28pt', '36pt', '48pt', '72pt']
    Quill.register(SizeStyle, true)

    // 4. Register custom fonts - using class-based approach
    const Font = Quill.import('formats/font')
    Font.whitelist = [
      // Google Fonts - Modern Sans-Serif
      'inter', 'roboto', 'open-sans', 'lato', 'montserrat', 'oswald',
      'source-sans', 'raleway', 'pt-sans', 'poppins', 'ubuntu', 'mukta',
      'noto-sans', 'rubik', 'work-sans', 'karla', 'libre-franklin',
      'fira-sans', 'archivo', 'dm-sans', 'quicksand', 'cabin', 'hind',
      'josefin-sans', 'oxygen', 'titillium-web', 'nunito-sans', 'barlow',
      'heebo', 'manrope', 'nunito',

      // Google Fonts - Serif
      'merriweather', 'playfair', 'lora', 'libre-baskerville', 'tinos',
      'crimson-text', 'eb-garamond', 'pt-serif', 'ibm-plex-serif',
      'bitter', 'cormorant',

      // Google Fonts - Monospace
      'courier-prime', 'space-mono', 'ibm-plex-mono', 'inconsolata',
      'ibm-plex-sans',

      // Common Word font aliases
      'arial', 'times', 'times-new-roman', 'calibri', 'cambria',
      'georgia', 'verdana', 'courier', 'courier-new', 'palatino'
    ]
    Quill.register(Font, true)

    // Define the modules object
    const modules = {
      toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': Font.whitelist }],
        [{ 'size': ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '22pt', '24pt', '26pt', '28pt', '36pt', '48pt', '72pt'] }],
        ['bold', 'italic', 'underline', 'strike'],

        // === START OF FIX ===
        // This line adds both the text color and background (highlighter) buttons
        [{ 'color': [] }, { 'background': [] }],
        // === END OF FIX ===

        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],  // This creates a dropdown with left, center, right, justify
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      imageResize: {
        parchment: Parchment,
        modules: ['Resize', 'DisplaySize', 'Toolbar'] // Toolbar adds alignment buttons (CSS will convert float to proper alignment)
      },
      clipboard: {
        matchVisual: false,
        matchers: [
          // Handle <mark> tags from mammoth (used for highlights)
          ['mark', function(node: HTMLElement, delta: any) {
            const ops: any[] = []
            const bgColor = node.style.backgroundColor || '#ffff00' // Default to yellow

            delta.ops.forEach((op: any) => {
              if (op.insert) {
                ops.push({
                  insert: op.insert,
                  attributes: {
                    ...op.attributes,
                    background: bgColor
                  }
                })
              } else {
                ops.push(op)
              }
            })
            return { ops }
          }],
          // Handle spans with highlight classes or inline background-color
          ['span', function(node: HTMLElement, delta: any) {
            const ops: any[] = []
            let bgColor = node.style.backgroundColor

            // Check for highlight classes
            const highlightClasses = [
              'highlight-yellow', 'highlight-green', 'highlight-cyan',
              'highlight-magenta', 'highlight-blue', 'highlight-red'
            ]

            for (const className of highlightClasses) {
              if (node.classList.contains(className)) {
                // Map class to color
                const colorMap: { [key: string]: string } = {
                  'highlight-yellow': '#ffff00',
                  'highlight-green': '#00ff00',
                  'highlight-cyan': '#00ffff',
                  'highlight-magenta': '#ff00ff',
                  'highlight-blue': '#0000ff',
                  'highlight-red': '#ff0000'
                }
                bgColor = colorMap[className]
                break
              }
            }

            if (bgColor) {
              // Convert to Quill's background format
              delta.ops.forEach((op: any) => {
                if (op.insert) {
                  ops.push({
                    insert: op.insert,
                    attributes: {
                      ...op.attributes,
                      background: bgColor
                    }
                  })
                } else {
                  ops.push(op)
                }
              })
              return { ops }
            }

            return delta
          }],
          // Handle spans with font-size
          ['span[style*="font-size"]', function(node: HTMLElement, delta: any) {
            const fontSize = node.style.fontSize

            if (fontSize) {
              const ops: any[] = []
              delta.ops.forEach((op: any) => {
                if (op.insert && typeof op.insert === 'string') {
                  ops.push({
                    insert: op.insert,
                    attributes: {
                      ...op.attributes,
                      size: fontSize
                    }
                  })
                } else {
                  ops.push(op)
                }
              })
              return { ops }
            }

            return delta
          }],
          // Handle <br> tags - preserve them as newlines
          ['br', function(node: HTMLElement, delta: any) {
            // In Quill, a line break should just be a newline
            return { ops: [{ insert: '\n' }] }
          }],
          // Handle paragraphs with text-align styles
          ['p', function(node: HTMLElement, delta: any) {
            const textAlign = node.style.textAlign

            // Check if this is an empty paragraph (just contains a <br>)
            const isEmpty = node.innerHTML.trim() === '<br>' || node.innerHTML.trim() === '<br />'

            if (isEmpty) {
              // Empty paragraph should just be a newline
              return { ops: [{ insert: '\n' }] }
            }

            if (textAlign && textAlign !== 'left' && textAlign !== '') {
              // In Quill, block formats like alignment need to be applied to the newline character
              const ops = delta.ops.slice()

              if (ops.length > 0) {
                const lastOp = ops[ops.length - 1]

                // Check if the last insert is a newline
                if (typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n')) {
                  // Apply alignment to the newline
                  lastOp.attributes = {
                    ...lastOp.attributes,
                    align: textAlign
                  }
                } else {
                  // If no newline, add one with the alignment
                  ops.push({
                    insert: '\n',
                    attributes: { align: textAlign }
                  })
                }
              }

              return { ops }
            }

            return delta
          }],
          // Handle headings with text-align styles
          ['h1', function(node: HTMLElement, delta: any) {
            const textAlign = node.style.textAlign
            if (textAlign && textAlign !== 'left' && textAlign !== '') {
              const ops = delta.ops.slice()
              if (ops.length > 0) {
                const lastOp = ops[ops.length - 1]
                if (typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n')) {
                  lastOp.attributes = {
                    ...lastOp.attributes,
                    align: textAlign,
                    header: 1
                  }
                }
              }
              return { ops }
            }
            return delta
          }],
          ['h2', function(node: HTMLElement, delta: any) {
            const textAlign = node.style.textAlign
            if (textAlign && textAlign !== 'left' && textAlign !== '') {
              const ops = delta.ops.slice()
              if (ops.length > 0) {
                const lastOp = ops[ops.length - 1]
                if (typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n')) {
                  lastOp.attributes = {
                    ...lastOp.attributes,
                    align: textAlign,
                    header: 2
                  }
                }
              }
              return { ops }
            }
            return delta
          }],
          ['h3', function(node: HTMLElement, delta: any) {
            const textAlign = node.style.textAlign
            if (textAlign && textAlign !== 'left' && textAlign !== '') {
              const ops = delta.ops.slice()
              if (ops.length > 0) {
                const lastOp = ops[ops.length - 1]
                if (typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n')) {
                  lastOp.attributes = {
                    ...lastOp.attributes,
                    align: textAlign,
                    header: 3
                  }
                }
              }
              return { ops }
            }
            return delta
          }],
          // Handle images with dimensions and alignment
          ['img', function(node: HTMLElement, delta: any) {
            // Extract attributes from the img element
            const ops: any[] = []

            delta.ops.forEach((op: any) => {
              if (op.insert && typeof op.insert === 'object' && op.insert.image) {
                // Build attributes object from the img element
                const attributes: any = {}

                if (node.hasAttribute('width')) {
                  attributes.width = node.getAttribute('width')
                }
                if (node.hasAttribute('height')) {
                  attributes.height = node.getAttribute('height')
                }

                // Handle style attribute and convert float to proper alignment
                if (node.hasAttribute('style')) {
                  let style = node.getAttribute('style') || ''

                  // CRITICAL FIX: Remove width and height from inline style
                  // The resize module needs to control size via attributes only
                  // Inline styles take precedence over attributes, blocking resize
                  style = style.replace(/width:\s*[^;]+;?/gi, '')
                  style = style.replace(/height:\s*[^;]+;?/gi, '')

                  // Convert float-based alignment to display + margin
                  if (style.includes('float: left') || style.includes('float:left')) {
                    style = style.replace(/float:\s*left;?/g, 'display: block;')
                    style = style.includes('margin-left') ? style : style + ' margin-left: 0; margin-right: auto;'
                  } else if (style.includes('float: right') || style.includes('float:right')) {
                    style = style.replace(/float:\s*right;?/g, 'display: block;')
                    style = style.includes('margin-left') ? style : style + ' margin-left: auto; margin-right: 0;'
                  } else if (style.includes('display: block') && !style.includes('float')) {
                    // Center alignment (display: block without float)
                    if (!style.includes('margin-left')) {
                      style += ' margin-left: auto; margin-right: auto;'
                    }
                  }

                  // Clean up extra semicolons and whitespace
                  style = style.replace(/;+/g, ';').replace(/^\s*;\s*/, '').trim()

                  if (style) {
                    attributes.style = style
                  }
                }

                if (node.hasAttribute('alt')) {
                  attributes.alt = node.getAttribute('alt')
                }

                ops.push({
                  insert: { image: op.insert.image },
                  attributes: Object.keys(attributes).length > 0 ? attributes : undefined
                })
              } else {
                ops.push(op)
              }
            })

            return ops.length > 0 ? { ops } : delta
          }]
        ]
      }
    }
    
    // Forward the ref and pass the modules to the real component
    const QuillWrapper = forwardRef<any, any>((props, ref) => (
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