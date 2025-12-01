import { useExchangeSelection, DOMESTIC_EXCHANGES, FOREIGN_EXCHANGES } from "@/contexts/ExchangeSelectionContext";

interface ExchangeSelectorProps {
  compact?: boolean;
  showLabels?: boolean;
}

export default function ExchangeSelector({ compact = false, showLabels = true }: ExchangeSelectorProps) {
  const { domesticExchange, foreignExchange, setDomesticExchange, setForeignExchange } = useExchangeSelection();

  const selectClass = compact
    ? "bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-blue-500 text-xs"
    : "bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm";

  return (
    <div className={`flex ${compact ? "gap-2" : "gap-4"} items-center flex-wrap`}>
      <div className="flex items-center gap-2">
        {showLabels && <span className="text-slate-400 text-sm">국내:</span>}
        <select
          value={domesticExchange}
          onChange={(e) => setDomesticExchange(e.target.value)}
          className={selectClass}
        >
          <optgroup label="업비트">
            {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "UPBIT").map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="빗썸">
            {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "BITHUMB").map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="코인원">
            {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "COINONE").map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <span className="text-slate-500">↔</span>

      <div className="flex items-center gap-2">
        {showLabels && <span className="text-slate-400 text-sm">해외:</span>}
        <select
          value={foreignExchange}
          onChange={(e) => setForeignExchange(e.target.value)}
          className={selectClass}
        >
          <optgroup label="Binance">
            {FOREIGN_EXCHANGES.filter((e) => e.exchange === "BINANCE" || e.exchange === "BINANCE_FUTURES").map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="기타 거래소">
            {FOREIGN_EXCHANGES.filter((e) => !e.exchange.startsWith("BINANCE")).map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
}

export function DomesticExchangeSelector({ compact = false }: { compact?: boolean }) {
  const { domesticExchange, setDomesticExchange } = useExchangeSelection();

  const selectClass = compact
    ? "bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-blue-500 text-xs"
    : "bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm";

  return (
    <select
      value={domesticExchange}
      onChange={(e) => setDomesticExchange(e.target.value)}
      className={selectClass}
    >
      <optgroup label="업비트">
        {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "UPBIT").map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="빗썸">
        {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "BITHUMB").map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="코인원">
        {DOMESTIC_EXCHANGES.filter((e) => e.exchange === "COINONE").map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

export function ForeignExchangeSelector({ compact = false }: { compact?: boolean }) {
  const { foreignExchange, setForeignExchange } = useExchangeSelection();

  const selectClass = compact
    ? "bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-blue-500 text-xs"
    : "bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 text-sm";

  return (
    <select
      value={foreignExchange}
      onChange={(e) => setForeignExchange(e.target.value)}
      className={selectClass}
    >
      <optgroup label="Binance">
        {FOREIGN_EXCHANGES.filter((e) => e.exchange === "BINANCE" || e.exchange === "BINANCE_FUTURES").map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="기타 거래소">
        {FOREIGN_EXCHANGES.filter((e) => !e.exchange.startsWith("BINANCE")).map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
