import { useExchangeSelection, DOMESTIC_EXCHANGES, FOREIGN_EXCHANGES, EXCHANGE_LOGOS } from "@/contexts/ExchangeSelectionContext";

interface ExchangeSelectorProps {
  compact?: boolean;
  showLabels?: boolean;
}

export default function ExchangeSelector({ compact = false, showLabels = true }: ExchangeSelectorProps) {
  const { domesticExchange, foreignExchange, setDomesticExchange, setForeignExchange } = useExchangeSelection();

  const currentDomestic = DOMESTIC_EXCHANGES.find(e => e.value === domesticExchange);
  const currentForeign = FOREIGN_EXCHANGES.find(e => e.value === foreignExchange);

  return (
    <div className={`flex ${compact ? "gap-2" : "gap-4"} items-center flex-wrap`}>
      <div className="flex items-center gap-2">
        {showLabels && <span className="text-slate-400 text-xs hidden md:inline">기준</span>}
        <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-600/50 hover:border-slate-500 transition-colors">
          <img 
            src={currentDomestic?.logo || EXCHANGE_LOGOS.UPBIT} 
            alt={currentDomestic?.exchange || 'exchange'}
            className="w-6 h-6 flex-shrink-0 rounded"
          />
          <select
            value={domesticExchange}
            onChange={(e) => setDomesticExchange(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-sm cursor-pointer font-medium min-w-[100px]"
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

      <span className="text-slate-500 text-lg">↔</span>

      <div className="flex items-center gap-2">
        {showLabels && <span className="text-slate-400 text-xs hidden md:inline">해외</span>}
        <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-600/50 hover:border-slate-500 transition-colors">
          <img 
            src={currentForeign?.logo || EXCHANGE_LOGOS.BINANCE} 
            alt={currentForeign?.exchange || 'exchange'}
            className="w-6 h-6 flex-shrink-0 rounded"
          />
          <select
            value={foreignExchange}
            onChange={(e) => setForeignExchange(e.target.value)}
            className="bg-transparent text-white focus:outline-none text-sm cursor-pointer font-medium min-w-[80px]"
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
    <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-600/50 hover:border-slate-500 transition-colors">
      <img 
        src={currentDomestic?.logo || EXCHANGE_LOGOS.UPBIT} 
        alt={currentDomestic?.exchange || 'exchange'}
        className="w-5 h-5 flex-shrink-0 rounded"
      />
      <select
        value={domesticExchange}
        onChange={(e) => setDomesticExchange(e.target.value)}
        className={`bg-transparent text-white focus:outline-none cursor-pointer font-medium ${compact ? 'text-xs' : 'text-sm'}`}
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
    <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-600/50 hover:border-slate-500 transition-colors">
      <img 
        src={currentForeign?.logo || EXCHANGE_LOGOS.BINANCE} 
        alt={currentForeign?.exchange || 'exchange'}
        className="w-5 h-5 flex-shrink-0 rounded"
      />
      <select
        value={foreignExchange}
        onChange={(e) => setForeignExchange(e.target.value)}
        className={`bg-transparent text-white focus:outline-none cursor-pointer font-medium ${compact ? 'text-xs' : 'text-sm'}`}
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
