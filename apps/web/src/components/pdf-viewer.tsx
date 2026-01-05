'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Настройка worker для react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  onDownload?: () => void;
}

export function PDFViewer({ url, onDownload }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Определение ширины контейнера для адаптивности
  const updateWidth = useCallback(() => {
    if (pdfContainerRef.current) {
      const width = pdfContainerRef.current.clientWidth - 16;
      setContainerWidth(width > 100 ? width : window.innerWidth - 32);
    } else {
      setContainerWidth(window.innerWidth - 32);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    const timer = setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateWidth);
    };
  }, [updateWidth]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setTimeout(updateWidth, 100);
  }

  const handleDownload = () => {
    if (onDownload) onDownload();
    window.open(url, '_blank');
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4">
      {/* Панель управления */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b">
        {/* Навигация по страницам */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            disabled={pageNumber <= 1}
            onClick={goToPrevPage}
            className="px-2 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ←
          </button>
          <span className="text-xs sm:text-sm whitespace-nowrap">
            {pageNumber} / {numPages || '...'}
          </span>
          <button
            disabled={pageNumber >= numPages}
            onClick={goToNextPage}
            className="px-2 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            →
          </button>
        </div>

        {/* Кнопка скачать */}
        <button
          onClick={handleDownload}
          className="px-2 sm:px-4 py-2 bg-[#16a34a] text-white rounded hover:bg-[#15803d] transition flex items-center gap-1 sm:gap-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Скачать</span>
        </button>
      </div>

      {/* PDF Документ */}
      <div ref={pdfContainerRef} className="bg-gray-100 rounded overflow-hidden">
        <div className="flex justify-center">
          {loading && (
            <div className="flex items-center justify-center h-64 sm:h-96">
              <div className="text-gray-600">Загрузка PDF...</div>
            </div>
          )}
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('Error loading PDF:', error)}
            loading={<div className="text-center py-8">Загрузка...</div>}
            error={<div className="text-center py-8 text-red-600">Ошибка загрузки PDF</div>}
          >
            <Page
              pageNumber={pageNumber}
              width={containerWidth > 0 ? containerWidth : undefined}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>

      {/* Большие кнопки навигации для мобильных */}
      <div className="flex justify-center gap-4 mt-4 sm:hidden">
        <button
          disabled={pageNumber <= 1}
          onClick={goToPrevPage}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          ← Назад
        </button>
        <button
          disabled={pageNumber >= numPages}
          onClick={goToNextPage}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
