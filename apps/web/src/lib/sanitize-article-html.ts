/**
 * Sanitize article HTML content to fix image scaling issues
 * Limits overly large dimensions while preserving reasonable ones
 * Adds responsive styling for proper display
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return html;

  // Process each img tag individually
  return html.replace(/<img\s[^>]*>/gi, (imgTag) => {
    let cleaned = imgTag;

    // Extract current width value if present
    const widthMatch = imgTag.match(/width\s*=\s*["']?(\d+)/i);
    const heightMatch = imgTag.match(/height\s*=\s*["']?(\d+)/i);

    const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : null;

    // Only remove dimensions if they're excessively large (> 1200px)
    // This preserves intentional sizing while fixing overflow issues
    if (width && width > 1200) {
      cleaned = cleaned.replace(/\swidth\s*=\s*["']?[^"'\s>]*["']?/gi, '');
    }
    if (height && height > 800) {
      cleaned = cleaned.replace(/\sheight\s*=\s*["']?[^"'\s>]*["']?/gi, '');
    }

    // Process style attribute - only remove excessively large dimensions
    cleaned = cleaned.replace(
      /\sstyle\s*=\s*["']([^"']*)["']/gi,
      (match, styleContent) => {
        let newStyle = styleContent;

        // Extract width value from style
        const styleWidthMatch = styleContent.match(/width\s*:\s*(\d+)px/i);
        const styleHeightMatch = styleContent.match(/height\s*:\s*(\d+)px/i);

        const styleWidth = styleWidthMatch ? parseInt(styleWidthMatch[1], 10) : null;
        const styleHeight = styleHeightMatch ? parseInt(styleHeightMatch[1], 10) : null;

        // Only remove if excessively large
        if (styleWidth && styleWidth > 1200) {
          newStyle = newStyle.replace(/width\s*:\s*[^;]+;?/gi, '');
        }
        if (styleHeight && styleHeight > 800) {
          newStyle = newStyle.replace(/height\s*:\s*[^;]+;?/gi, '');
        }

        // Clean up formatting
        newStyle = newStyle
          .replace(/;;+/g, ';')
          .replace(/^;|;$/g, '')
          .trim();

        if (newStyle) {
          return ` style="${newStyle}"`;
        }
        return '';
      }
    );

    // Clean up multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/\s+>/g, '>');

    return cleaned;
  });
}
