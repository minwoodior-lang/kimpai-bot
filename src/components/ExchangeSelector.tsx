import { useExchangeSelection, DOMESTIC_EXCHANGES, FOREIGN_EXCHANGES } from "@/contexts/ExchangeSelectionContext";

interface ExchangeSelectorProps {
  compact?: boolean;
  showLabels?: boolean;
}

export default function ExchangeSelector({ compact = false, showLabels = true }: ExchangeSelectorProps) {
  const { domesticExchange, foreignExchange, setDomesticExchange, setForeignExchange } = useExchangeSelection();

  const currentDomestic = DOMESTIC_EXCHANGES.find(e => e.value === domesticExchange);
  const currentForeign = FOREIGN_EXCHANGES.find(e => e.value === foreignExchange);

  return (
    <div className={`flex ${compact ? "gap-2" : "gap-3"} items-center flex-wrap`}>
      <div className="flex items-center gap-1">
        {showLabels && <span className="text-slate-400 text-xs hidden md:inline">기준</span>}
        <div className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1.5 border border-slate-600">
          <img 
            src={currentDomestic?.logo || '/exchanges/upbit.svg'} 
            alt="" 
            className="w-4 h-4 flex-shrink-0"
          />
          <select
            value={domesticExchange}
            onChange={(e) => setDomesticExchange(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-sm cursor-pointer"
          >
            <optgroup label="업비트">
              {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "UPBIT").map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label.replace('🇰🇷 ', '')}
                </option>
              ))}
            </optgroup>
            <optgroup label="빗썸">
              {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "BITHUMB").map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label.replace('🇰🇷 ', '')}
                </option>
              ))}
            </optgroup>
            <optgroup label="코인원">
              {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "COINONE").map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label.replace('🇰🇷 ', '')}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      <span className="text-slate-500">↔</span>

      <div className="flex items-center gap-1">
        {showLabels && <span className="text-slate-400 text-xs hidden md:inline">해외</span>}
        <div className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1.5 border border-slate-600">
          <img 
            src={currentForeign?.logo || '/exchanges/binance.svg'} 
            alt="" 
            className="w-4 h-4 flex-shrink-0"
          />
          <select
            value={foreignExchange}
            onChange={(e) => setForeignExchange(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-sm cursor-pointer"
          >
            <optgroup label="Binance">
              {FOREIGN_EXCHANGES.filter((e) => e.exchange === "BINANCE" || e.exchange === "BINANCE_FUTURES").map((e) => (
                <option key={e.value} value={e.value}>
                  {e.shortName}
                </option>
              ))}
            </optgroup>
            <optgroup label="기타 거래소">
              {FOREIGN_EXCHANGES.filter((e) => !e.exchange.startsWith("BINANCE")).map((e) => (
                <option key={e.value} value={e.value}>
                  {e.shortName}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  );
}

export function DomesticExchangeSelector({ compact = false }: { compact?: boolean }) {
  const { domesticExchange, setDomesticExchange } = useExchangeSelection();
  const currentDomestic = DOMESTIC_EXCHANGES.find(e => e.value === domesticExchange);

  return (
    <div className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1.5 border border-slate-600">
      <img 
        src={currentDomestic?.logo || '/exchanges/upbit.svg'} 
        alt="" 
        className="w-4 h-4 flex-shrink-0"
      />
      <select
        value={domesticExchange}
        onChange={(e) => setDomesticExchange(e.target.value)}
        className={`bg-transparent text-white focus:outline-none cursor-pointer ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <optgroup label="업비트">
          {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "UPBIT").map((e) => (
            <option key={e.value} value={e.value}>
              {e.label.replace('🇰🇷 ', '')}
            </option>
          ))}
        </optgroup>
        <optgroup label="빗썸">
          {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "BITHUMB").map((e) => (
            <option key={e.value} value={e.value}>
              {e.label.replace('🇰🇷 ', '')}
            </option>
          ))}
        </optgroup>
        <optgroup label="코인원">
          {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "COINONE").map((e) => (
            <option key={e.value} value={e.value}>
              {e.label.replace('🇰🇷 ', '')}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

export function ForeignExchangeSelector({ compact = false }: { compact?: boolean }) {
  const { foreignExchange, setForeignExchange } = useExchangeSelection();
  const currentForeign = FOREIGN_EXCHANGES.find(e => e.value === foreignExchange);

  return (
    <div className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1.5 border border-slate-600">
      <img 
        src={currentForeign?.logo || '/exchanges/binance.svg'} 
        alt="" 
        className="w-4 h-4 flex-shrink-0"
      />
      <select
        value={foreignExchange}
        onChange={(e) => setForeignExchange(e.target.value)}
        className={`bg-transparent text-white focus:outline-none cursor-pointer ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <optgroup label="Binance">
          {FOREIGN_EXCHANGES.filter((e) => e.exchange === "BINANCE" || e.exchange === "BINANCE_FUTURES").map((e) => (
            <option key={e.value} value={e.value}>
              {e.shortName}
            </option>
          ))}
        </optgroup>
        <optgroup label="기타 거래소">
          {FOREIGN_EXCHANGES.filter((e) => !e.exchange.startsWith("BINANCE")).map((e) => (
            <option key={e.value} value={e.value}>
              {e.shortName}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
