'use client';

import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-header w-full"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-600">{icon}</span>}
          <span className="font-medium text-gray-900">{title}</span>
          {badge}
        </div>
        <FaChevronDown
          className={`collapsible-icon text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
}
