// Use 'require' instead of 'import' for CommonJS compatibility on the server
const mammoth = require('mammoth')
const JSZip = require('jszip')
const docx4js = require('docx4js')
// 1. We remove the 'import { mammoth as mammothTypes }' line that was causing the error.

import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import sizeOf from 'image-size'

// 2. This function will now use the 'mammoth' const we required.
function transformElement(element: any) {
  // Handle paragraphs with alignment
  if (element.type === 'paragraph') {
    console.log('transformElement called for paragraph, alignment:', element.alignment)

    // Check for alignment
    if (element.alignment && element.alignment !== 'left') {
      console.log('transformElement creating paragraph with alignment:', element.alignment)

      const p = new mammoth.elements.Element('p', {});
      p.children = element.children;

      // Add text-align style for center, right, justify
      const alignMap: { [key: string]: string } = {
        'center': 'center',
        'right': 'right',
        'justify': 'justify',
        'both': 'justify'  // Word uses 'both' for justify
      };

      if (alignMap[element.alignment]) {
        p.attributes = p.attributes || {};
        p.attributes.style = `text-align: ${alignMap[element.alignment]};`;
        console.log('Applied style:', p.attributes.style)
      }

      return p;
    }

    // Find paragraphs styled as Headings
    if (element.styleName === 'Heading 1') {
      return new mammoth.elements.Element('h1', {}, element.children);
    }
    if (element.styleName === 'Heading 2') {
      return new mammoth.elements.Element('h2', {}, element.children);
    }
    if (element.styleName === 'Heading 3') {
      return new mammoth.elements.Element('h3', {}, element.children);
    }
  }

  // Handle runs with highlights - convert the entire run to a mark element
  if (element.type === 'run' && element.highlight) {
    console.log('Transforming run with highlight:', element.highlight, 'children:', element.children)

    // Map Word highlight colors to CSS colors
    const highlightColorMap: { [key: string]: string } = {
      'yellow': '#ffff00',
      'green': '#00ff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
      'blue': '#0000ff',
      'red': '#ff0000',
      'darkBlue': '#00008b',
      'darkCyan': '#008b8b',
      'darkGreen': '#006400',
      'darkMagenta': '#8b008b',
      'darkRed': '#8b0000',
      'darkYellow': '#808000',
      'darkGray': '#a9a9a9',
      'lightGray': '#d3d3d3',
      'black': '#000000'
    }

    const bgColor = highlightColorMap[element.highlight] || '#ffff00'

    // Create a mark element that will wrap the text
    const mark = new mammoth.elements.Element('mark', {
      style: `background-color: ${bgColor};`
    }, element.children)

    console.log('Created mark element:', mark)
    return mark
  }

  return element;
}

// New function using docx4js to parse DOCX with better highlight support
export async function convertDocxToHtmlWithDocx4js(buffer: Buffer): Promise<{
  html: string
  messages: string[]
}> {
  try {
    // Load the DOCX file
    const docx = await docx4js.load(buffer)

    const htmlParts: string[] = []
    const messages: string[] = []

    // Use the render function to traverse and extract content
    const content = docx.render({
      createElement(type: string, props: any, children: any[]): any {
        console.log('Element type:', type, 'props:', props, 'children:', children)

        // Build HTML based on element type
        switch(type) {
          case 'paragraph':
            const pStyle = props?.style || {}
            const alignment = pStyle.alignment || props?.alignment
            const alignStyle = alignment && alignment !== 'left' ? ` style="text-align: ${alignment};"` : ''
            const childrenHtml = children ? children.join('') : ''
            return `<p${alignStyle}>${childrenHtml}</p>`

          case 'text':
            let text = props?.text || (typeof children === 'string' ? children : '')

            // Check for highlight in props
            if (props?.highlight || props?.highlightColor || props?.['w:highlight']) {
              const color = props?.highlight || props?.highlightColor || props?.['w:highlight']
              console.log('Found highlight:', color, 'on text:', text)
              text = `<mark style="background-color: ${color};">${text}</mark>`
            }

            // Check for bold
            if (props?.bold || props?.isBold || props?.['w:b']) {
              text = `<strong>${text}</strong>`
            }

            // Check for italic
            if (props?.italic || props?.isItalic || props?.['w:i']) {
              text = `<em>${text}</em>`
            }

            // Check for underline
            if (props?.underline || props?.isUnderline || props?.['w:u']) {
              text = `<u>${text}</u>`
            }

            return text

          case 'run':
            // A run contains text with formatting
            const runHtml = children ? children.join('') : ''

            // Check if the run itself has highlight info
            if (props?.highlight || props?.rPr?.highlight || props?.['w:highlight']) {
              const color = props?.highlight || props?.rPr?.highlight || props?.['w:highlight']
              console.log('Found highlight on run:', color)
              return `<mark style="background-color: ${color};">${runHtml}</mark>`
            }

            return runHtml

          case 'list':
            const listType = props?.ordered ? 'ol' : 'ul'
            return `<${listType}>${children ? children.join('') : ''}</${listType}>`

          case 'listItem':
            return `<li>${children ? children.join('') : ''}</li>`

          case 'image':
            if (props?.src) {
              return `<img src="${props.src}" />`
            }
            return ''

          default:
            // For unknown types, just join children
            return children ? children.join('') : ''
        }
      }
    })

    console.log('docx4js render output:', content)

    return {
      html: typeof content === 'string' ? content : JSON.stringify(content),
      messages
    }

  } catch (error: any) {
    console.error('docx4js parsing error:', error)
    throw error
  }
}


export async function convertDocxToHtml(buffer: Buffer): Promise<{
  html: string
  messages: string[]
}> {

  // First, parse DOCX with JSZip to extract image display dimensions and alignment from the XML
  const imageDisplaySizes: { width?: number, height?: number, alignment?: string }[] = []

  try {
    const zip = await JSZip.loadAsync(buffer)
    const documentXml = await zip.file('word/document.xml')?.async('string')

    if (documentXml) {
      // Find all paragraphs containing images and extract both dimensions and alignment
      // Look for pattern: <w:p> ... <w:jc w:val="center"/> ... <wp:extent cx="..." cy="..."/> ... </w:p>
      const paragraphRegex = /<w:p>[\s\S]*?<\/w:p>/g
      let pMatch

      while ((pMatch = paragraphRegex.exec(documentXml)) !== null) {
        const paragraphXml = pMatch[0]

        // Check if this paragraph contains an image (has wp:extent)
        const extentMatch = /<wp:extent\s+cx="(\d+)"\s+cy="(\d+)"/.exec(paragraphXml)

        if (extentMatch) {
          const cx = parseInt(extentMatch[1]) // width in EMUs
          const cy = parseInt(extentMatch[2]) // height in EMUs

          // Extract alignment from the same paragraph
          const alignmentMatch = /<w:jc\s+w:val="([^"]+)"/.exec(paragraphXml)
          const alignment = alignmentMatch ? alignmentMatch[1] : 'left'

          const displaySize: any = {
            // Convert EMUs to pixels (914400 EMUs = 1 inch = 96 pixels)
            width: Math.round(cx / 9525),
            height: Math.round(cy / 9525),
            alignment: alignment
          }

          imageDisplaySizes.push(displaySize)
          console.log(`[JSZip] Found image #${imageDisplaySizes.length} display size from DOCX XML:`, displaySize, `(EMUs: ${cx} x ${cy})`)
        }
      }
    }
  } catch (err) {
    console.error('Failed to parse DOCX with JSZip for image info:', err)
  }

  // Collect highlighted text, aligned paragraphs, font sizes, images, and empty paragraph positions for post-processing
  const highlightedRuns: { text: string, color: string }[] = []
  const alignedParagraphs: { text: string, alignment: string, isListItem?: boolean }[] = []
  const fontSizedRuns: { text: string, size: string }[] = []
  const imageMetadata: { contentType: string, width?: number, height?: number, altText?: string }[] = []
  let emptyParagraphCount = 0
  let imageConversionIndex = 0 // Track which image we're converting

  // 4. We remove the ': mammothTypes.Options' type annotation
  const options = {
    transformDocument: (document: any) => {
      // Map Word highlight colors to CSS colors
      const highlightColorMap: { [key: string]: string } = {
        'yellow': '#ffff00',
        'green': '#00ff00',
        'cyan': '#00ffff',
        'magenta': '#ff00ff',
        'blue': '#0000ff',
        'red': '#ff0000',
        'darkBlue': '#00008b',
        'darkCyan': '#008b8b',
        'darkGreen': '#006400',
        'darkMagenta': '#8b008b',
        'darkRed': '#8b0000',
        'darkYellow': '#808000',
        'darkGray': '#a9a9a9',
        'lightGray': '#d3d3d3',
        'black': '#000000'
      }

      // Alignment map
      const alignMap: { [key: string]: string } = {
        'center': 'center',
        'right': 'right',
        'justify': 'justify',
        'both': 'justify'
      }

      // Helper to extract text from an element tree
      function extractText(element: any): string {
        if (element.type === 'text') {
          return element.value || ''
        }
        if (element.children) {
          return element.children.map(extractText).join('')
        }
        return ''
      }

      // Walk through and process elements
      function processElements(element: any): any {
        // Handle paragraphs with alignment
        if (element.type === 'paragraph') {
          const paragraphText = extractText(element)
          const isEmpty = !paragraphText || paragraphText.trim() === ''

          // Check if this paragraph contains an image
          const childTypes = element.children ? element.children.map((c: any) => c.type).join(', ') : 'no children'

          console.log('Processing paragraph, alignment:', element.alignment, 'isEmpty:', isEmpty, 'text:', paragraphText.substring(0, 50), 'children types:', childTypes)

          // Track empty paragraphs
          if (isEmpty) {
            emptyParagraphCount++
            // Insert a marker that we'll replace later
            const marker = `__EMPTY_PARA_${emptyParagraphCount}__`
            return {
              ...element,
              children: [{
                type: 'text',
                value: marker
              }]
            }
          }

          if (element.alignment && element.alignment !== 'left') {
            console.log('Found aligned paragraph:', element.alignment)

            // Extract text from paragraph for post-processing
            if (paragraphText) {
              const cssAlignment = alignMap[element.alignment] || element.alignment
              alignedParagraphs.push({ text: paragraphText, alignment: cssAlignment })
              console.log('Collected aligned paragraph:', paragraphText, 'alignment:', cssAlignment)
            }
          }
        }

        // Handle list items with alignment
        if (element.type === 'listItem') {
          const itemText = extractText(element)
          console.log('Found list item, text:', itemText)

          // Check if parent list or item has alignment info
          // List items inherit from their paragraph, so check child paragraphs
          if (element.children) {
            element.children.forEach((child: any) => {
              if (child.type === 'paragraph' && child.alignment && child.alignment !== 'left') {
                const cssAlignment = alignMap[child.alignment] || child.alignment
                alignedParagraphs.push({ text: itemText, alignment: cssAlignment, isListItem: true })
                console.log('Collected aligned list item:', itemText, 'alignment:', cssAlignment)
              }
            })
          }
        }

        // Collect highlighted text
        if (element.type === 'run' && element.highlight) {
          const bgColor = highlightColorMap[element.highlight] || '#ffff00'

          // Extract text from children
          if (element.children) {
            element.children.forEach((child: any) => {
              if (child.type === 'text' && child.value) {
                console.log('Found highlighted text:', child.value, 'color:', bgColor)
                highlightedRuns.push({ text: child.value, color: bgColor })
              }
            })
          }
        }

        // Collect font sizes from runs
        if (element.type === 'run' && element.fontSize) {
          // Extract text from children
          if (element.children) {
            element.children.forEach((child: any) => {
              if (child.type === 'text' && child.value) {
                // Font size in Word is in half-points (e.g., 24 = 12pt)
                const ptSize = element.fontSize / 2
                console.log('Found text with font size:', child.value.substring(0, 30), 'size:', ptSize + 'pt')
                fontSizedRuns.push({ text: child.value, size: ptSize + 'pt' })
              }
            })
          }
        }

        // Recursively process children
        if (element.children) {
          const processedChildren = element.children.map(processElements)
          return { ...element, children: processedChildren }
        }

        return element
      }

      document.children = document.children.map(processElements)
      return document
    },

    transformElement: transformElement,

    // 5. We remove the ': mammothTypes.Image' type annotation
    convertImage: mammoth.images.imgElement(async function(image: any) {
      try {
        const arrayBuffer = await image.read()
        const imageBuffer = Buffer.from(arrayBuffer)

        // Get display dimensions from DOCX XML (preferred) or fall back to intrinsic size
        console.log(`[Mammoth] Converting image #${imageConversionIndex + 1} of ${imageDisplaySizes.length}`)
        const displaySize = imageDisplaySizes[imageConversionIndex]
        console.log(`[Mammoth] Display size from XML for image #${imageConversionIndex + 1}:`, displaySize)

        let width = displaySize?.width
        let height = displaySize?.height

        // If JSZip didn't find dimensions, use intrinsic image size as fallback
        if (!width || !height) {
          try {
            const intrinsicSize = sizeOf(imageBuffer)
            width = width || intrinsicSize.width
            height = height || intrinsicSize.height
            console.log('Using intrinsic image size:', width, 'x', height)
          } catch (err) {
            console.error('Failed to detect image dimensions:', err)
          }
        } else {
          console.log('Using display size from DOCX XML:', width, 'x', height)
        }

        // Store metadata for this image
        const metadata: any = {
          contentType: image.contentType || 'image/png',
          altText: image.altText || '',
          width,
          height
        }

        imageMetadata.push(metadata)
        console.log('Stored image metadata:', metadata)

        imageConversionIndex++ // Move to next image

        // Convert image to base64 data URI instead of saving to disk
        // This ensures images work in both local and remote deployments
        const base64 = imageBuffer.toString('base64')
        const mimeType = image.contentType || 'image/png'
        const dataUri = `data:${mimeType};base64,${base64}`

        console.log('Converted image to base64 data URI, size:', base64.length, 'chars')

        return {
          src: dataUri
        }
      } catch (error) {
        console.error("Failed to convert image in docx:", error);
        return {
          src: ""
        };
      }
    })
  }

  // Pass the Buffer to mammoth using the 'buffer' key
  const result = await mammoth.convertToHtml(
    { buffer: buffer },
    options
  )

  // Post-process HTML to wrap highlighted text in mark tags and add alignment
  let html = result.value

  console.log('Highlighted runs to process:', highlightedRuns)
  console.log('Aligned paragraphs to process:', alignedParagraphs)
  console.log('Font sized runs to process:', fontSizedRuns)

  // FIRST: Replace empty paragraph markers with <br /> (before any other processing)
  for (let i = 1; i <= emptyParagraphCount; i++) {
    const marker = `__EMPTY_PARA_${i}__`
    // Replace <p>marker</p> with <p><br /></p>
    html = html.replace(`<p>${marker}</p>`, '<p><br /></p>')
    console.log('Replaced empty paragraph marker', i)
  }

  // SECOND: Wrap each highlighted text with mark tags
  highlightedRuns.forEach(({ text, color }) => {
    // Simple replacement - just find the exact text
    // This will match the first occurrence, which should be correct since mammoth outputs in document order
    const replacement = `<mark style="background-color: ${color};">${text}</mark>`

    console.log('Replacing:', text, 'with mark tag')
    console.log('Before replacement:', html.substring(0, 100))

    // Just use simple string replace for the first occurrence
    html = html.replace(text, replacement)

    console.log('After replacement:', html.substring(0, 100))
  })

  // THIRD: Add alignment to paragraphs and list items
  alignedParagraphs.forEach(({ text, alignment, isListItem }) => {
    console.log('Adding alignment to', isListItem ? 'list item' : 'paragraph', ':', text.substring(0, 50), 'alignment:', alignment)

    const textPattern = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Try to match as both list item AND paragraph since we might not know which it is
    // First try list item
    const listItemRegex = new RegExp(`<li>([^<]*${textPattern}[^<]*)</li>`, 'i')
    const listItemRegexNested = new RegExp(`<li>((?:<[^>]+>)*${textPattern}(?:</[^>]+>)*)</li>`, 'i')

    if (html.match(listItemRegex)) {
      html = html.replace(listItemRegex, `<li style="text-align: ${alignment};">$1</li>`)
      console.log('Applied alignment to simple list item')
      return
    } else if (html.match(listItemRegexNested)) {
      html = html.replace(listItemRegexNested, `<li style="text-align: ${alignment};">$1</li>`)
      console.log('Applied alignment to nested list item')
      return
    }

    // If not found as list item, try as paragraph
    const paragraphRegex = new RegExp(`<p>([^<]*${textPattern}[^<]*)</p>`, 'i')
    const paragraphRegexNested = new RegExp(`<p>((?:<[^>]+>)*${textPattern}(?:</[^>]+>)*)</p>`, 'i')

    if (html.match(paragraphRegex)) {
      html = html.replace(paragraphRegex, `<p style="text-align: ${alignment};">$1</p>`)
      console.log('Applied alignment to simple paragraph')
    } else if (html.match(paragraphRegexNested)) {
      html = html.replace(paragraphRegexNested, `<p style="text-align: ${alignment};">$1</p>`)
      console.log('Applied alignment to nested paragraph')
    } else {
      console.log('Could not find paragraph or list item containing:', text.substring(0, 50))
    }
  })

  // FOURTH: Add font sizes to text
  fontSizedRuns.forEach(({ text, size }) => {
    console.log('Adding font size to text:', text.substring(0, 30), 'size:', size)

    // Escape special regex characters
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Match text that's not already in a span with font-size
    // This pattern looks for the text either standalone or wrapped in formatting tags
    const textRegex = new RegExp(`(?<!font-size[^>]*>)${escapedText}(?!</span>)`, 'i')

    if (html.match(textRegex)) {
      // Wrap in span with font-size
      html = html.replace(textRegex, `<span style="font-size: ${size};">${text}</span>`)
      console.log('Applied font size:', size)
    } else {
      console.log('Could not find text for font sizing:', text.substring(0, 30))
    }
  })

  // FIFTH: Apply image dimensions and alignment
  console.log('=== APPLYING IMAGE METADATA ===')
  console.log('Processing images, metadata count:', imageMetadata.length)
  console.log('Image display sizes with alignment:', JSON.stringify(imageDisplaySizes, null, 2))
  console.log('Image metadata details:', JSON.stringify(imageMetadata, null, 2))

  // Alignment map for Word alignment values to CSS
  const alignMap: { [key: string]: string } = {
    'center': 'center',
    'right': 'right',
    'justify': 'justify',
    'both': 'justify',
    'left': 'left'
  }

  // Find all images (both wrapped in <p> and standalone) and apply dimensions and alignment
  let imgIndex = 0

  // Match both <p><img.../></p> and standalone <img.../>
  html = html.replace(/(?:<p>)?(<img[^>]*>)(?:<\/p>)?/g, (match: string, imgTag: string) => {
    // Skip if this doesn't look like a complete img tag
    if (!imgTag.includes('src=')) {
      return match
    }

    console.log(`[HTML Post-process] Found image #${imgIndex + 1}, match:`, match.substring(0, 100))

    if (imgIndex < imageMetadata.length && imgIndex < imageDisplaySizes.length) {
      const metadata = imageMetadata[imgIndex]
      const displaySize = imageDisplaySizes[imgIndex]
      const wordAlignment = displaySize.alignment || 'left'
      const cssAlignment = alignMap[wordAlignment] || 'left'

      console.log(`[HTML Post-process] >>> Applying to image #${imgIndex + 1}:`, metadata, 'Word alignment:', wordAlignment, '-> CSS:', cssAlignment)
      imgIndex++

      // Build style attribute for width, height, and alignment
      const styles: string[] = []
      if (metadata.width) {
        styles.push(`width: ${metadata.width}px`)
      }
      if (metadata.height) {
        styles.push(`height: ${metadata.height}px`)
      }

      // Apply alignment directly to the image element
      if (cssAlignment === 'center') {
        // Center-aligned images: use block display with auto margins
        styles.push('display: block')
        styles.push('margin-left: auto')
        styles.push('margin-right: auto')
      } else if (cssAlignment === 'right') {
        // Right-aligned images: use display block with auto left margin
        styles.push('display: block')
        styles.push('margin-left: auto')
        styles.push('margin-right: 0')
      }
      // Left alignment is default, no additional styles needed

      // Apply styles to img tag
      let newImgTag = imgTag
      if (styles.length > 0) {
        const styleAttr = `style="${styles.join('; ')}"`
        // Insert style before the closing /> or >
        newImgTag = imgTag.replace(/\s*\/?>$/, ` ${styleAttr} />`)
      }

      // Wrap in a paragraph with clear:both to prevent float stacking issues
      const result = `<p style="clear: both;">${newImgTag}</p>`

      console.log('Replaced with:', result.substring(0, 150))
      return result
    }
    return match
  })

  console.log('Total images processed:', imgIndex)
  console.log('Post-processed HTML (first 800 chars):', html.substring(0, 800))

  // 6. This maps the message objects to simple strings for the toast
  return {
    html: html,
    messages: result.messages.map((m: any) => m.message)
  }
}

export function processWordPaste(html: string): string {
  // Clean up Word-specific formatting while preserving structure
  return html
    .replace(/<o:p\s*\/?>|<\/o:p>/g, '') // Remove Word paragraphs
    .replace(/class="Mso[^"]*"/g, '') // Remove Word classes
    .replace(/style="[^"]*mso-[^"]*"/g, '') // Remove Word styles
    .replace(/<(\/)?(font|span)[^>]*>/g, '') // Remove font tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
}