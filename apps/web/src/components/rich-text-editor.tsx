'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUploadImage, useUploadVideo } from '@/hooks/use-media';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizableImage } from './extensions/resizable-image';
import { ResizableVideo } from './extensions/resizable-video';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaCode,
  FaImage,
  FaUndo,
  FaRedo,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaLink,
  FaHeading,
  FaVideo,
  FaYoutube,
  FaTimes,
  FaUpload,
  FaChevronDown,
  FaEllipsisH,
  FaFont,
  FaParagraph,
} from 'react-icons/fa';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertYoutube: (url: string) => void;
  onUploadVideo: (file: File) => void;
  isUploading: boolean;
  isMobile: boolean;
}

interface ToolbarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Mobile bottom sheet popup for toolbar groups
const ToolbarPopup = ({ isOpen, onClose, title, children }: ToolbarPopupProps) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="toolbar-popup-overlay" onClick={onClose} />
      <div className="toolbar-popup">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
};

const VideoModal = ({ isOpen, onClose, onInsertYoutube, onUploadVideo, isUploading, isMobile }: VideoModalProps) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (youtubeUrl.trim()) {
      onInsertYoutube(youtubeUrl.trim());
      setYoutubeUrl('');
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadVideo(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onUploadVideo(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className={`bg-white w-full ${isMobile ? 'rounded-t-2xl max-h-[85vh]' : 'rounded-lg max-w-md mx-4'} overflow-hidden`}>
        {/* Handle for mobile */}
        {isMobile && <div className="bottom-sheet-handle" />}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Вставить видео</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 min-h-[48px] ${
              activeTab === 'youtube'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaYoutube className="text-lg" />
            YouTube
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 min-h-[48px] ${
              activeTab === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaUpload />
            Загрузить
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'youtube' ? (
            <form onSubmit={handleYoutubeSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ссылка на YouTube видео
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
              />
              <p className="mt-2 text-xs text-gray-500">
                Поддерживаются ссылки: youtube.com/watch, youtu.be, youtube.com/shorts
              </p>
              <button
                type="submit"
                disabled={!youtubeUrl.trim()}
                className="mt-4 w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] font-medium"
              >
                <FaYoutube />
                Вставить видео
              </button>
            </form>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors min-h-[150px] flex flex-col items-center justify-center"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-gray-600">Загрузка видео...</p>
                  </div>
                ) : (
                  <>
                    <FaVideo className="mx-auto text-4xl text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">
                      {isMobile ? 'Нажмите для выбора видео' : 'Нажмите для выбора или перетащите видео'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      MP4, WebM, OGG (макс. 100 МБ)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Desktop Menu Bar
const DesktopMenuBar = ({ editor, onImageUpload, onVideoOpen, isUploading }: {
  editor: Editor;
  onImageUpload: () => void;
  onVideoOpen: () => void;
  isUploading: boolean;
}) => {
  const addLink = () => {
    const url = window.prompt('Введите URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50 sticky top-0 z-10">
      {/* Text Formatting */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
          title="Жирный (Ctrl+B)"
        >
          <FaBold />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="Курсив (Ctrl+I)"
        >
          <FaItalic />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('underline') ? 'bg-gray-300' : ''
          }`}
          title="Подчеркнутый (Ctrl+U)"
        >
          <FaUnderline />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('strike') ? 'bg-gray-300' : ''
          }`}
          title="Зачеркнутый"
        >
          <FaStrikethrough />
        </button>
      </div>

      {/* Headings */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 flex items-center ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
          }`}
          title="Заголовок 1"
        >
          <FaHeading className="text-lg" />
          <span className="text-xs">1</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 flex items-center ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
          }`}
          title="Заголовок 2"
        >
          <FaHeading className="text-base" />
          <span className="text-xs">2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 flex items-center ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
          }`}
          title="Заголовок 3"
        >
          <FaHeading className="text-sm" />
          <span className="text-xs">3</span>
        </button>
      </div>

      {/* Lists */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="Маркированный список"
        >
          <FaListUl />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="Нумерованный список"
        >
          <FaListOl />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
          }`}
          title="По левому краю"
        >
          <FaAlignLeft />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
          }`}
          title="По центру"
        >
          <FaAlignCenter />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
          }`}
          title="По правому краю"
        >
          <FaAlignRight />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''
          }`}
          title="По ширине"
        >
          <FaAlignJustify />
        </button>
      </div>

      {/* Other */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
          title="Цитата"
        >
          <FaQuoteLeft />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('codeBlock') ? 'bg-gray-300' : ''
          }`}
          title="Блок кода"
        >
          <FaCode />
        </button>
        <button
          type="button"
          onClick={addLink}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('link') ? 'bg-gray-300' : ''
          }`}
          title="Добавить ссылку"
        >
          <FaLink />
        </button>
      </div>

      {/* Image & Video */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          type="button"
          onClick={onImageUpload}
          disabled={isUploading}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Вставить изображение"
        >
          {isUploading ? (
            <div className="animate-spin">⏳</div>
          ) : (
            <FaImage />
          )}
        </button>
        <button
          type="button"
          onClick={onVideoOpen}
          className="p-2 rounded hover:bg-gray-200"
          title="Вставить видео (YouTube или загрузить)"
        >
          <FaVideo />
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Отменить (Ctrl+Z)"
        >
          <FaUndo />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Повторить (Ctrl+Y)"
        >
          <FaRedo />
        </button>
      </div>
    </div>
  );
};

// Mobile Menu Bar with grouped actions
const MobileMenuBar = ({ editor, onImageUpload, onVideoOpen, isUploading }: {
  editor: Editor;
  onImageUpload: () => void;
  onVideoOpen: () => void;
  isUploading: boolean;
}) => {
  const [activePopup, setActivePopup] = useState<'format' | 'heading' | 'align' | 'more' | null>(null);

  const addLink = () => {
    const url = window.prompt('Введите URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setActivePopup(null);
  };

  const closePopup = () => setActivePopup(null);

  const ToolButton = ({ onClick, isActive, icon, label }: {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-lg min-w-[60px] ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <>
      <div className="mobile-editor-toolbar">
        {/* Row 1: Most used formatting */}
        <div className="flex gap-1 flex-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2.5 rounded-lg ${editor.isActive('bold') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200'}`}
          >
            <FaBold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2.5 rounded-lg ${editor.isActive('italic') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200'}`}
          >
            <FaItalic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2.5 rounded-lg ${editor.isActive('underline') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200'}`}
          >
            <FaUnderline className="w-4 h-4" />
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Heading group button */}
          <button
            type="button"
            onClick={() => setActivePopup('heading')}
            className={`p-2.5 rounded-lg flex items-center gap-1 ${
              editor.isActive('heading') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200'
            }`}
          >
            <FaHeading className="w-4 h-4" />
            <FaChevronDown className="w-2.5 h-2.5" />
          </button>

          {/* Alignment group button */}
          <button
            type="button"
            onClick={() => setActivePopup('align')}
            className="p-2.5 rounded-lg flex items-center gap-1 hover:bg-gray-200"
          >
            <FaAlignLeft className="w-4 h-4" />
            <FaChevronDown className="w-2.5 h-2.5" />
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2.5 rounded-lg ${editor.isActive('bulletList') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200'}`}
          >
            <FaListUl className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2.5 rounded-lg ${editor.isActive('orderedList') ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200'}`}
          >
            <FaListOl className="w-4 h-4" />
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Media */}
          <button
            type="button"
            onClick={onImageUpload}
            disabled={isUploading}
            className="p-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full" />
            ) : (
              <FaImage className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onVideoOpen}
            className="p-2.5 rounded-lg hover:bg-gray-200"
          >
            <FaVideo className="w-4 h-4" />
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* More options */}
          <button
            type="button"
            onClick={() => setActivePopup('more')}
            className="p-2.5 rounded-lg hover:bg-gray-200"
          >
            <FaEllipsisH className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Undo/Redo (always visible) */}
        <div className="flex gap-1 ml-auto">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"
          >
            <FaUndo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-30"
          >
            <FaRedo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Heading Popup */}
      <ToolbarPopup isOpen={activePopup === 'heading'} onClose={closePopup} title="Заголовки">
        <ToolButton
          onClick={() => { editor.chain().focus().setParagraph().run(); closePopup(); }}
          isActive={editor.isActive('paragraph')}
          icon={<FaParagraph />}
          label="Текст"
        />
        <ToolButton
          onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); closePopup(); }}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={<span className="font-bold">H1</span>}
          label="Заголовок 1"
        />
        <ToolButton
          onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); closePopup(); }}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={<span className="font-bold">H2</span>}
          label="Заголовок 2"
        />
        <ToolButton
          onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); closePopup(); }}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={<span className="font-bold">H3</span>}
          label="Заголовок 3"
        />
      </ToolbarPopup>

      {/* Alignment Popup */}
      <ToolbarPopup isOpen={activePopup === 'align'} onClose={closePopup} title="Выравнивание">
        <ToolButton
          onClick={() => { editor.chain().focus().setTextAlign('left').run(); closePopup(); }}
          isActive={editor.isActive({ textAlign: 'left' })}
          icon={<FaAlignLeft />}
          label="По левому"
        />
        <ToolButton
          onClick={() => { editor.chain().focus().setTextAlign('center').run(); closePopup(); }}
          isActive={editor.isActive({ textAlign: 'center' })}
          icon={<FaAlignCenter />}
          label="По центру"
        />
        <ToolButton
          onClick={() => { editor.chain().focus().setTextAlign('right').run(); closePopup(); }}
          isActive={editor.isActive({ textAlign: 'right' })}
          icon={<FaAlignRight />}
          label="По правому"
        />
        <ToolButton
          onClick={() => { editor.chain().focus().setTextAlign('justify').run(); closePopup(); }}
          isActive={editor.isActive({ textAlign: 'justify' })}
          icon={<FaAlignJustify />}
          label="По ширине"
        />
      </ToolbarPopup>

      {/* More Options Popup */}
      <ToolbarPopup isOpen={activePopup === 'more'} onClose={closePopup} title="Дополнительно">
        <ToolButton
          onClick={() => { editor.chain().focus().toggleStrike().run(); closePopup(); }}
          isActive={editor.isActive('strike')}
          icon={<FaStrikethrough />}
          label="Зачёркнутый"
        />
        <ToolButton
          onClick={() => { editor.chain().focus().toggleBlockquote().run(); closePopup(); }}
          isActive={editor.isActive('blockquote')}
          icon={<FaQuoteLeft />}
          label="Цитата"
        />
        <ToolButton
          onClick={() => { editor.chain().focus().toggleCodeBlock().run(); closePopup(); }}
          isActive={editor.isActive('codeBlock')}
          icon={<FaCode />}
          label="Код"
        />
        <ToolButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          icon={<FaLink />}
          label="Ссылка"
        />
      </ToolbarPopup>
    </>
  );
};

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadImage();
  const uploadVideo = useUploadVideo();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  // Use false as default during SSR to prevent hydration mismatch
  const isMobile = useIsMobile(640) ?? false;

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (file: File) => {
    try {
      const response = await uploadImage.mutateAsync(file);
      editor.chain().focus().setImage({ src: response.data.url }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Ошибка при загрузке изображения');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleInsertYoutube = (url: string) => {
    editor.chain().focus().setVideo({ src: url, videoType: 'youtube' }).run();
  };

  const handleUploadVideo = async (file: File) => {
    try {
      const response = await uploadVideo.mutateAsync(file);
      editor.chain().focus().setVideo({ src: response.data.url, videoType: 'local' }).run();
      setIsVideoModalOpen(false);
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Ошибка при загрузке видео');
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isMobile ? (
        <MobileMenuBar
          editor={editor}
          onImageUpload={handleImageButtonClick}
          onVideoOpen={() => setIsVideoModalOpen(true)}
          isUploading={uploadImage.isPending}
        />
      ) : (
        <DesktopMenuBar
          editor={editor}
          onImageUpload={handleImageButtonClick}
          onVideoOpen={() => setIsVideoModalOpen(true)}
          isUploading={uploadImage.isPending}
        />
      )}

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onInsertYoutube={handleInsertYoutube}
        onUploadVideo={handleUploadVideo}
        isUploading={uploadVideo.isPending}
        isMobile={isMobile}
      />
    </>
  );
};

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const uploadImage = useUploadImage();
  const uploadVideo = useUploadVideo();
  const isUpdatingRef = useRef(false);
  // Use false as default during SSR to prevent hydration mismatch
  const isMobile = useIsMobile(640) ?? false;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      ResizableImage.configure({
        allowBase64: true,
      }),
      ResizableVideo,
      Placeholder.configure({
        placeholder: placeholder || 'Начните писать...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (!isUpdatingRef.current) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: isMobile
          ? 'prose prose-sm max-w-none focus:outline-none min-h-[250px] p-4'
          : 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[400px] p-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];

          if (file.type.startsWith('image/')) {
            event.preventDefault();

            const uploadFile = async () => {
              try {
                const response = await uploadImage.mutateAsync(file);
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

                if (coordinates) {
                  const node = schema.nodes.resizableImage.create({ src: response.data.url });
                  const transaction = view.state.tr.insert(coordinates.pos, node);
                  view.dispatch(transaction);
                }
              } catch (error) {
                console.error('Failed to upload image:', error);
                alert('Ошибка при загрузке изображения');
              }
            };

            uploadFile();
            return true;
          }

          if (file.type.startsWith('video/')) {
            event.preventDefault();

            const uploadFile = async () => {
              try {
                const response = await uploadVideo.mutateAsync(file);
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

                if (coordinates) {
                  const node = schema.nodes.resizableVideo.create({
                    src: response.data.url,
                    videoType: 'local'
                  });
                  const transaction = view.state.tr.insert(coordinates.pos, node);
                  view.dispatch(transaction);
                }
              } catch (error) {
                console.error('Failed to upload video:', error);
                alert('Ошибка при загрузке видео');
              }
            };

            uploadFile();
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            event.preventDefault();
            const file = items[i].getAsFile();

            if (file) {
              const uploadFile = async () => {
                try {
                  const response = await uploadImage.mutateAsync(file);
                  editor?.chain().focus().setImage({ src: response.data.url }).run();
                } catch (error) {
                  console.error('Failed to upload image:', error);
                  alert('Ошибка при загрузке изображения');
                }
              };

              uploadFile();
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (!editor || !content) return;

    const currentContent = editor.getHTML();

    if (content !== currentContent && content.trim() !== '') {
      try {
        isUpdatingRef.current = true;
        editor.commands.setContent(content, false);
      } catch (error) {
        console.error('Failed to set editor content:', error);
        try {
          editor.commands.clearContent();
          editor.commands.setContent(content, false);
        } catch (retryError) {
          console.error('Failed to set content on retry:', retryError);
        }
      } finally {
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white editor-container">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
