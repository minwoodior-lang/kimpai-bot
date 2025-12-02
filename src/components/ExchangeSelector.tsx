import { useState, useRef, useEffect } from "react";
import { useExchangeSelection, DOMESTIC_EXCHANGES, FOREIGN_EXCHANGES, EXCHANGE_LOGOS } from "@/contexts/ExchangeSelectionContext";

interface ExchangeSelectorProps {
  compact?: boolean;
  showLabels?: boolean;
}

interface CustomDropdownProps {
  value: string;
  options: { value: string; label: string; logo: string; shortName?: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  showShortName?: boolean;
}

function CustomDropdown({ value, options, onChange, placeholder = "선택", showShortName = false }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(o => o.value === value);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-600/50 hover:border-slate-500 transition-colors min-w-[120px]"
      >
        {selectedOption && (
          <img 
            src={selectedOption.logo} 
            alt="" 
            className="w-5 h-5 flex-shrink-0 rounded"
          />
        )}
        <span className="text-white text-sm font-medium flex-1 text-left truncate">
          {showShortName ? selectedOption?.shortName || selectedOption?.label : selectedOption?.label || placeholder}
        </span>
        <svg 
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          <div>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors ${
                  value === option.value ? 'bg-slate-700/50' : ''
                }`}
              >
                <img 
                  src={option.logo} 
                  alt="" 
                  className="w-5 h-5 flex-shrink-0 rounded"
                />
                <span className="text-white text-sm whitespace-nowrap">
                  {option.label}
                </span>
                {value === option.value && (
                  <svg className="w-4 h-4 text-blue-400 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExchangeSelector({ compact = false, showLabels = true }: ExchangeSelectorProps) {
  const { domesticExchange, foreignExchange, setDomesticExchange, setForeignExchange } = useExchangeSelection();

  const domesticOptions = DOMESTIC_EXCHANGES.map(e => ({
    value: e.value,
    label: e.label.replace('🇰🇷 ', ''),
    logo: e.logo,
  }));

  const foreignOptions = FOREIGN_EXCHANGES.map(e => ({
    value: e.value,
    label: e.label,
    shortName: e.shortName,
    logo: e.logo,
  }));

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
      {/* Mobile: Labels on top row */}
      <div className="flex md:hidden justify-between w-full">
        <span className="text-slate-400 text-[10px] whitespace-nowrap flex items-center gap-1">
          기준 거래소 <img src="https://flagcdn.com/w20/kr.png" alt="🇰🇷" className="w-4 h-3 object-cover rounded-sm" />
        </span>
        <span className="text-slate-400 text-[10px] whitespace-nowrap flex items-center gap-1">
          해외 거래소 <span className="text-sm">🌐</span>
        </span>
      </div>

      {/* Dropdowns row */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* PC only: Left label */}
        {showLabels && (
          <span className="hidden md:flex text-slate-400 text-xs whitespace-nowrap items-center gap-1">
            기준 거래소 <img src="https://flagcdn.com/w20/kr.png" alt="🇰🇷" className="w-4 h-3 object-cover rounded-sm" />
          </span>
        )}
        
        <CustomDropdown
          value={domesticExchange}
          options={domesticOptions}
          onChange={setDomesticExchange}
        />

        <span className="text-slate-500 text-lg">⇄</span>

        <CustomDropdown
          value={foreignExchange}
          options={foreignOptions}
          onChange={setForeignExchange}
          showShortName={false}
        />

        {/* PC only: Right label */}
        {showLabels && (
          <span className="hidden md:flex text-slate-400 text-xs whitespace-nowrap items-center gap-1">
            해외 거래소 <span className="text-base">🌐</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function DomesticExchangeSelector({ compact = false }: { compact?: boolean }) {
  const { domesticExchange, setDomesticExchange } = useExchangeSelection();

  const domesticOptions = DOMESTIC_EXCHANGES.map(e => ({
    value: e.value,
    label: e.label.replace('🇰🇷 ', ''),
    logo: e.logo,
  }));

  return (
    <CustomDropdown
      value={domesticExchange}
      options={domesticOptions}
      onChange={setDomesticExchange}
    />
  );
}

export function ForeignExchangeSelector({ compact = false }: { compact?: boolean }) {
  const { foreignExchange, setForeignExchange } = useExchangeSelection();

  const foreignOptions = FOREIGN_EXCHANGES.map(e => ({
    value: e.value,
    label: e.label,
    shortName: e.shortName,
    logo: e.logo,
  }));

  return (
    <CustomDropdown
      value={foreignExchange}
      options={foreignOptions}
      onChange={setForeignExchange}
      showShortName={true}
    />
  );
}
