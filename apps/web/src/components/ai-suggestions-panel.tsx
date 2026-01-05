'use client';

import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AISuggestion {
  category: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
}

interface AIAnalysis {
  score: number;
  summary: string;
  suggestions: AISuggestion[];
  strengths: string[];
  improvements: {
    title?: string;
    excerpt?: string;
  };
}

interface AISuggestionsPanelProps {
  analysis: AIAnalysis;
  onClose: () => void;
  onApplyImprovement?: (field: 'title' | 'excerpt', value: string) => void;
}

export function AISuggestionsPanel({
  analysis,
  onClose,
  onApplyImprovement,
}: AISuggestionsPanelProps) {
  const [expandedSuggestions, setExpandedSuggestions] = useState<number[]>([]);
  // Use false as default during SSR to prevent hydration mismatch
  const isMobile = useIsMobile(640) ?? false;

  // Safely extract improvement text - handle malformed data
  const getImprovementText = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      return (field as any).kk || (field as any).ru || (field as any).kazakh || (field as any).russian || '';
    }
    return String(field);
  };

  const toggleSuggestion = (index: number) => {
    setExpandedSuggestions((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex ${isMobile ? 'items-end' : 'items-center'} justify-center ${isMobile ? '' : 'p-4'}`}>
      <div className={`bg-white shadow-xl w-full overflow-hidden flex flex-col ${
        isMobile
          ? 'h-full rounded-none'
          : 'rounded-lg max-w-4xl max-h-[90vh]'
      }`}>
        {/* Header */}
        <div className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`font-bold flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              <svg className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI-редактор
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-4'}`}>
            <div className="flex-1">
              <div className="text-sm opacity-90 mb-1">Общая оценка статьи</div>
              <div className={`font-bold ${isMobile ? 'text-3xl' : 'text-4xl'} ${getScoreColor(analysis.score)}`}>
                {analysis.score}/100
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm opacity-90 mb-1">Статус</div>
              <div className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
                {analysis.score >= 80 && '✨ Отлично!'}
                {analysis.score >= 60 && analysis.score < 80 && '👍 Хорошо'}
                {analysis.score < 60 && '📝 Требует доработки'}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-6'} space-y-4 sm:space-y-6`}>
          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Краткое резюме</h3>
            <p className={`text-gray-700 ${isMobile ? 'text-sm' : ''}`}>{analysis.summary}</p>
          </div>

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <span>✅</span> Сильные стороны
              </h3>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-green-800">
                    <span className="mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {(analysis.improvements.title || analysis.improvements.excerpt) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span>💡</span> Предложения по улучшению
              </h3>
              <div className="space-y-3">
                {analysis.improvements.title && (
                  <div>
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      Улучшенный заголовок:
                    </div>
                    <div className="bg-white border border-blue-300 rounded p-3 flex items-start justify-between gap-2">
                      <p className="text-gray-800 flex-1">{getImprovementText(analysis.improvements.title)}</p>
                      {onApplyImprovement && (
                        <button
                          onClick={() => onApplyImprovement('title', getImprovementText(analysis.improvements.title))}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded whitespace-nowrap"
                        >
                          Применить
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {analysis.improvements.excerpt && (
                  <div>
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      Улучшенное описание:
                    </div>
                    <div className="bg-white border border-blue-300 rounded p-3 flex items-start justify-between gap-2">
                      <p className="text-gray-800 flex-1">{getImprovementText(analysis.improvements.excerpt)}</p>
                      {onApplyImprovement && (
                        <button
                          onClick={() => onApplyImprovement('excerpt', getImprovementText(analysis.improvements.excerpt))}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded whitespace-nowrap"
                        >
                          Применить
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📋</span> Рекомендации
              </h3>
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg overflow-hidden ${getSeverityColor(suggestion.severity)}`}
                  >
                    <button
                      onClick={() => toggleSuggestion(index)}
                      className="w-full p-4 flex items-center justify-between hover:opacity-80 transition"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <span className="text-xl">{getSeverityIcon(suggestion.severity)}</span>
                        <div>
                          <div className="font-medium">{suggestion.title}</div>
                          <div className="text-xs opacity-75 mt-0.5">{suggestion.category}</div>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 transition-transform ${
                          expandedSuggestions.includes(index) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSuggestions.includes(index) && (
                      <div className="px-4 pb-4 bg-white bg-opacity-50">
                        <p className="text-sm leading-relaxed">{suggestion.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t border-gray-200 ${isMobile ? 'p-4 pb-safe' : 'p-4'} bg-gray-50`}>
          <button
            onClick={onClose}
            className={`w-full bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 rounded transition ${isMobile ? 'py-4 min-h-[52px]' : 'py-3'}`}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
