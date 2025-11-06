// Use 'require' instead of 'import' for CommonJS compatibility on the server
const mammoth = require('mammoth')
// 1. We remove the 'import { mammoth as mammothTypes }' line that was causing the error.

import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// 2. This function will now use the 'mammoth' const we required.
function transformElement(element) {
  // Find text runs (r) that have a style named 'Highlight'
  if (element.type === 'run' && element.styleName === 'Highlight') {
    // 3. Changed 'mammothTypes.elements.Element' to 'mammoth.elements.Element'
    const span = new mammoth.elements.Element('span', {});
    
    // Create the style attribute for the span
    span.attributes.style = 'background-color: yellow;';
    
    span.children = element.children;
    return span;
  }

  // Find text runs that are bold, italic, or underline
  if (element.type === 'run') {
    if (element.isBold) {
      const strong = new mammoth.elements.Element('strong', {});
      strong.children = element.children;
      element.children = [strong];
    }
    if (element.isItalic) {
      const em = new mammoth.elements.Element('em', {});
      em.children = element.children;
      element.children = [em];
    }
    if (element.isUnderline) {
      const u = new mammoth.elements.Element('u', {});
      u.children = element.children;
      element.children = [u];
    }
  }

  // Find paragraphs styled as Headings
  if (element.type === 'paragraph') {
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

  return element;
}


export async function convertDocxToHtml(buffer: Buffer): Promise<{
  html: string
  messages: string[]
}> {

  // 4. We remove the ': mammothTypes.Options' type annotation
  const options = {
    transformElement: transformElement,
    
    // 5. We remove the ': mammothTypes.Image' type annotation
    convertImage: mammoth.images.imgElement(async function(image) {
      try {
        const arrayBuffer = await image.read()
        const imageBuffer = Buffer.from(arrayBuffer)

        const extension = image.contentType.split('/')[1] || 'png'
        const filename = `${uuidv4()}.${extension}`
        const imagePath = path.join(process.cwd(), 'public', 'uploads', filename)
        
        await fs.mkdir(path.dirname(imagePath), { recursive: true })
        await fs.writeFile(imagePath, imageBuffer)
        
        return {
          src: `/uploads/${filename}`
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
  
  // 6. This maps the message objects to simple strings for the toast
  return {
    html: result.value,
    messages: result.messages.map(m => m.message)
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