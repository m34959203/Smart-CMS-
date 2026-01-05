import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { NodeViewProps } from '@tiptap/core';
import { useState, useRef, useEffect } from 'react';
import { FaArrowsAlt, FaAlignLeft, FaAlignCenter, FaAlignRight, FaPlay, FaYoutube } from 'react-icons/fa';

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const ResizableVideoComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
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

    const container = containerRef.current;
    if (container) {
      startWidth.current = container.offsetWidth;
      startHeight.current = container.offsetHeight;
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

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

      // Maintain 16:9 aspect ratio if resizing from corners
      if (resizeDirection.length === 2) {
        newHeight = (newWidth * 9) / 16;
      }

      // Set minimum size
      newWidth = Math.max(200, newWidth);
      newHeight = Math.max(112, newHeight);

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

  const { src, width, height, align = 'center', videoType = 'local' } = node.attrs;

  const getWrapperStyle = () => {
    const styles: React.CSSProperties = {
      display: 'block',
    };

    if (align === 'center') {
      styles.textAlign = 'center';
    } else if (align === 'right') {
      styles.textAlign = 'right';
    } else {
      styles.textAlign = 'left';
    }

    return styles;
  };

  const renderVideo = () => {
    if (videoType === 'youtube') {
      const videoId = getYouTubeVideoId(src);
      if (!videoId) {
        return (
          <div className="flex items-center justify-center bg-gray-200 rounded" style={{ width: width || 560, height: height || 315 }}>
            <span className="text-gray-500">Неверная ссылка YouTube</span>
          </div>
        );
      }
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          width={width || 560}
          height={height || 315}
          className="rounded"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // Local video
    return (
      <video
        src={src}
        width={width || 560}
        height={height || 315}
        controls
        className="rounded"
        style={{
          width: width ? `${width}px` : '560px',
          height: height ? `${height}px` : '315px',
        }}
      >
        Ваш браузер не поддерживает видео
      </video>
    );
  };

  return (
    <NodeViewWrapper
      className="resizable-video-wrapper group relative inline-block"
      data-drag-handle
      style={getWrapperStyle()}
    >
      <div
        ref={containerRef}
        className={`relative inline-block border-2 rounded ${
          selected ? 'border-blue-500' : 'border-transparent'
        } transition-all`}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
        }}
      >
        {renderVideo()}

        {/* Video type indicator */}
        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          {videoType === 'youtube' ? (
            <>
              <FaYoutube className="text-red-500" />
              YouTube
            </>
          ) : (
            <>
              <FaPlay />
              Видео
            </>
          )}
        </div>

        {/* Alignment controls - visible when selected */}
        {selected && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded shadow-lg flex gap-1 p-1 z-20">
            <button
              onClick={() => updateAttributes({ align: 'left' })}
              className={`p-2 rounded hover:bg-gray-100 ${
                align === 'left' ? 'bg-blue-100 text-blue-600' : ''
              }`}
              title="По левому краю"
            >
              <FaAlignLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateAttributes({ align: 'center' })}
              className={`p-2 rounded hover:bg-gray-100 ${
                align === 'center' ? 'bg-blue-100 text-blue-600' : ''
              }`}
              title="По центру"
            >
              <FaAlignCenter className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateAttributes({ align: 'right' })}
              className={`p-2 rounded hover:bg-gray-100 ${
                align === 'right' ? 'bg-blue-100 text-blue-600' : ''
              }`}
              title="По правому краю"
            >
              <FaAlignRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Drag handle - visible on hover and when selected */}
        <div
          className={`absolute top-2 left-2 bg-blue-500 text-white p-1.5 rounded shadow-lg cursor-move transition-opacity pointer-events-none ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
          }`}
          title="Перетащите для перемещения видео"
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
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
                {width || 560} × {height || 315}
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableVideo: {
      setVideo: (options: { src: string; videoType?: 'local' | 'youtube'; width?: number; height?: number }) => ReturnType;
    };
  }
}

export const ResizableVideo = Node.create({
  name: 'resizableVideo',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: 560,
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
      height: {
        default: 315,
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return { height: attributes.height };
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
      videoType: {
        default: 'local',
        renderHTML: (attributes) => {
          return { 'data-video-type': attributes.videoType };
        },
        parseHTML: (element) => {
          return element.getAttribute('data-video-type') || 'local';
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="resizable-video"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { src, width, height, align, videoType } = node.attrs;

    // Helper to extract YouTube video ID
    const getYouTubeVideoId = (url: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/,
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    };

    const wrapperAttrs = mergeAttributes(HTMLAttributes, {
      'data-type': 'resizable-video',
      'data-video-type': videoType,
      'data-align': align || 'center',
      style: `text-align: ${align || 'center'}; margin: 1rem 0;`,
    });

    if (videoType === 'youtube') {
      const videoId = getYouTubeVideoId(src);
      if (videoId) {
        return [
          'div',
          wrapperAttrs,
          [
            'iframe',
            {
              src: `https://www.youtube.com/embed/${videoId}`,
              width: width || 560,
              height: height || 315,
              frameborder: '0',
              allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
              allowfullscreen: 'true',
              style: 'border-radius: 0.5rem; max-width: 100%;',
            },
          ],
        ];
      }
    }

    // Local video
    return [
      'div',
      wrapperAttrs,
      [
        'video',
        {
          src: src,
          width: width || 560,
          height: height || 315,
          controls: 'true',
          style: `border-radius: 0.5rem; max-width: 100%; width: ${width || 560}px; height: ${height || 315}px;`,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableVideoComponent);
  },
});
