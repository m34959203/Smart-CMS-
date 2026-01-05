import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeViewProps } from '@tiptap/core';
import { useState, useRef, useEffect } from 'react';
import { FaArrowsAlt, FaAlignLeft, FaAlignCenter, FaAlignRight } from 'react-icons/fa';

const ResizableImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startWidth = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeDirection(direction);
    startX.current = e.clientX;
    startY.current = e.clientY;

    const img = imgRef.current;
    if (img) {
      startWidth.current = img.offsetWidth;
      startHeight.current = img.offsetHeight;
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return;

      const deltaX = e.clientX - startX.current;
      const deltaY = e.clientY - startY.current;

      let newWidth = startWidth.current;
      let newHeight = startHeight.current;

      // Calculate new dimensions based on resize direction
      if (resizeDirection.includes('e')) {
        newWidth = startWidth.current + deltaX;
      } else if (resizeDirection.includes('w')) {
        newWidth = startWidth.current - deltaX;
      }

      if (resizeDirection.includes('s')) {
        newHeight = startHeight.current + deltaY;
      } else if (resizeDirection.includes('n')) {
        newHeight = startHeight.current - deltaY;
      }

      // Maintain aspect ratio if resizing from corners
      if (resizeDirection.length === 2) {
        const aspectRatio = startWidth.current / startHeight.current;
        newHeight = newWidth / aspectRatio;
      }

      // Set minimum size
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(50, newHeight);

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, updateAttributes]);

  const { src, alt, title, width, height, align = 'center', float = 'none' } = node.attrs;

  const getWrapperStyle = () => {
    const styles: React.CSSProperties = {};

    if (float === 'left') {
      styles.float = 'left';
      styles.marginRight = '1rem';
      styles.marginBottom = '0.5rem';
      styles.display = 'block';
    } else if (float === 'right') {
      styles.float = 'right';
      styles.marginLeft = '1rem';
      styles.marginBottom = '0.5rem';
      styles.display = 'block';
    } else {
      // For non-floating images, use text-align on wrapper for positioning
      styles.display = 'block';
      if (align === 'center') {
        styles.textAlign = 'center';
      } else if (align === 'right') {
        styles.textAlign = 'right';
      } else {
        styles.textAlign = 'left';
      }
    }

    return styles;
  };

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper group"
      data-drag-handle
      data-float={float}
      style={getWrapperStyle()}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        className={`rounded border-2 ${
          selected ? 'border-blue-500' : 'border-transparent'
        } transition-all`}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
        }}
      />

      {/* Alignment controls - visible when selected */}
      {selected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded shadow-lg flex gap-1 p-1 z-20">
          <button
            onClick={() => updateAttributes({ align: 'left', float: 'none' })}
            className={`p-2 rounded hover:bg-gray-100 ${
              align === 'left' && float === 'none' ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="По левому краю"
          >
            <FaAlignLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => updateAttributes({ align: 'center', float: 'none' })}
            className={`p-2 rounded hover:bg-gray-100 ${
              align === 'center' && float === 'none' ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="По центру"
          >
            <FaAlignCenter className="w-3 h-3" />
          </button>
          <button
            onClick={() => updateAttributes({ align: 'right', float: 'none' })}
            className={`p-2 rounded hover:bg-gray-100 ${
              align === 'right' && float === 'none' ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="По правому краю"
          >
            <FaAlignRight className="w-3 h-3" />
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            onClick={() => updateAttributes({ float: 'left', align: 'left' })}
            className={`p-2 rounded hover:bg-gray-100 ${
              float === 'left' ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="Обтекание справа"
          >
            <div className="flex items-center gap-1">
              <FaAlignLeft className="w-3 h-3" />
              <span className="text-xs">↷</span>
            </div>
          </button>
          <button
            onClick={() => updateAttributes({ float: 'right', align: 'right' })}
            className={`p-2 rounded hover:bg-gray-100 ${
              float === 'right' ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title="Обтекание слева"
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">↶</span>
              <FaAlignRight className="w-3 h-3" />
            </div>
          </button>
        </div>
      )}

      {/* Drag handle - visible on hover and when selected */}
      <div
        className={`absolute top-2 left-2 bg-blue-500 text-white p-1.5 rounded shadow-lg cursor-move transition-opacity pointer-events-none ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
        }`}
        title="Перетащите для перемещения изображения"
      >
        <FaArrowsAlt className="w-3 h-3" />
      </div>

      {selected && (
        <>
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize -translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize -translate-x-1/2 translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize translate-x-1/2 translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />

          {/* Edge handles */}
          <div
            className="absolute top-0 left-1/2 w-3 h-3 bg-blue-500 border border-white cursor-n-resize -translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'n')}
          />
          <div
            className="absolute bottom-0 left-1/2 w-3 h-3 bg-blue-500 border border-white cursor-s-resize -translate-x-1/2 translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 's')}
          />
          <div
            className="absolute top-1/2 left-0 w-3 h-3 bg-blue-500 border border-white cursor-w-resize -translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'w')}
          />
          <div
            className="absolute top-1/2 right-0 w-3 h-3 bg-blue-500 border border-white cursor-e-resize translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'e')}
          />

          {/* Dimensions tooltip - only visible during resize */}
          {isResizing && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {width || 'auto'} × {height || 'auto'}
            </div>
          )}
        </>
      )}
    </NodeViewWrapper>
  );
};

export const ResizableImage = Image.extend({
  name: 'resizableImage',

  inline: true,

  group: 'inline',

  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          // Store as data attribute only, not as width attribute
          // This allows CSS to control sizing for proper responsive behavior
          return { 'data-width': attributes.width };
        },
        parseHTML: (element) => {
          return element.getAttribute('data-width') || element.getAttribute('width') || null;
        },
      },
      height: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          // Store as data attribute only, not as height attribute
          // This allows CSS to control sizing for proper responsive behavior
          return { 'data-height': attributes.height };
        },
        parseHTML: (element) => {
          return element.getAttribute('data-height') || element.getAttribute('height') || null;
        },
      },
      align: {
        default: 'center',
        renderHTML: (attributes) => {
          return { 'data-align': attributes.align };
        },
        parseHTML: (element) => {
          return element.getAttribute('data-align') || 'center';
        },
      },
      float: {
        default: 'none',
        renderHTML: (attributes) => {
          return { 'data-float': attributes.float };
        },
        parseHTML: (element) => {
          return element.getAttribute('data-float') || 'none';
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
