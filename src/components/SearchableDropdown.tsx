import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, AlertCircle } from 'lucide-react';
import { stringSimilarity } from '../utils/multiSearch';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  id?: string;
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search options...',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        opt.value.toLowerCase().includes(term) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  // Compute closest suggestions if there is no match
  const closestOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (filteredOptions.length > 0 || !term) return [];
    return options
      .map((opt) => ({
        opt,
        score: stringSimilarity(term, opt.label),
      }))
      .filter((item) => item.opt.value !== 'ALL' && item.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.opt);
  }, [filteredOptions, searchTerm, options]);

  // Selected option display text
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // If user types an exact match for an option in the dropdown search box,
  // automatically select and load it instead of requiring a manual click
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || !isOpen) return;
    const exactMatch = options.find(
      (opt) =>
        opt.label.toLowerCase() === term ||
        opt.value.toLowerCase() === term
    );
    if (exactMatch && exactMatch.value !== value) {
      onChange(exactMatch.value);
    }
  }, [searchTerm, isOpen, options, value, onChange]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-11 px-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 flex items-center justify-between text-left transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white shadow-2xs ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Hidden native select for accessibility & form compatibility */}
      <select
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Dropdown Menu Panel with Top Search Feature */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Top Search Input Box on top of options */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-8 pr-7 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick status count & top-right status */}
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] font-semibold text-slate-500">
              <span>
                {filteredOptions.length === options.length
                  ? `${options.length} options`
                  : `${filteredOptions.length} of ${options.length} match`}
              </span>
              {filteredOptions.length === 0 ? (
                <span className="text-[11px] font-bold text-red-600 animate-pulse flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  No results found.
                </span>
              ) : searchTerm ? (
                <span className="text-slate-400">Press Enter to select</span>
              ) : null}
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1 text-xs sm:text-sm divide-y divide-slate-50"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3.5 py-3 text-left text-xs space-y-2.5 bg-red-50/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    No results found.
                  </span>
                  <span className="text-[10px] text-slate-400 italic">
                    Reference quote: &ldquo;{searchTerm}&rdquo;
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  No option in this list exactly matches &ldquo;{searchTerm}&rdquo;.
                </p>
                {closestOptions.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/70 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Close Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {closestOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(opt.value)}
                          className="px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : isSelected
                        ? 'bg-amber-50/60 text-slate-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-700 shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
