import Head from "next/head";
import Layout from "@/components/layout/Layout";
import { useRouter } from "next/router";
import Link from "next/link";

interface PatternData {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  occurrences: number;
  lastSeen: string;
  predictedMove: string;
  confidence: number;
}

const mockPatterns: Record<string, PatternData> = {
  "bullish-divergence": {
    id: "bullish-divergence",
    name: "Bullish Divergence",
    description: "Premium decreasing while global prices rise, indicating potential buying opportunity in Korean markets.",
    accuracy: 72,
    occurrences: 45,
    lastSeen: "2024-01-15",
    predictedMove: "Premium increase of 1-2% within 48 hours",
    confidence: 68,
  },
  "bearish-divergence": {
    id: "bearish-divergence",
    name: "Bearish Divergence",
    description: "Premium increasing while global prices fall, suggesting potential selling pressure ahead.",
    accuracy: 68,
    occurrences: 32,
    lastSeen: "2024-01-14",
    predictedMove: "Premium decrease of 0.5-1.5% within 24 hours",
    confidence: 61,
  },
  "premium-spike": {
    id: "premium-spike",
    name: "Premium Spike",
    description: "Sudden increase in Kimchi Premium above 5%, often followed by mean reversion.",
    accuracy: 78,
    occurrences: 28,
    lastSeen: "2024-01-12",
    predictedMove: "Reversion to 3-4% premium within 72 hours",
    confidence: 74,
  },
};

export default function PatternDetail() {
  const router = useRouter();
  const { patternId } = router.query;

  const pattern = patternId && typeof patternId === "string" ? mockPatterns[patternId] : null;

  if (!pattern) {
    return (
      <Layout>
        <Head>
          <title>Pattern Not Found - KimpAI</title>
        </Head>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Pattern Not Found</h1>
            <p className="text-slate-400 mb-6">The pattern you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/analysis"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Back to Analysis
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{pattern.name} - KimpAI Pattern Analysis</title>
        <meta name="description" content={pattern.description} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/analysis" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analysis
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{pattern.name}</h1>
          <p className="text-slate-400 text-lg">{pattern.description}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">Historical Accuracy</div>
            <div className="text-2xl font-bold text-green-400">{pattern.accuracy}%</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">Total Occurrences</div>
            <div className="text-2xl font-bold text-white">{pattern.occurrences}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">Last Detected</div>
            <div className="text-2xl font-bold text-white">{pattern.lastSeen}</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-slate-400 text-sm mb-2">Confidence</div>
            <div className="text-2xl font-bold text-blue-400">{pattern.confidence}%</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Predicted Outcome</h2>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <p className="text-slate-300">{pattern.predictedMove}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-slate-500">Confidence Level</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${pattern.confidence}%` }}
                  ></div>
                </div>
                <span className="text-white font-medium">{pattern.confidence}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Pattern History</h2>
            <div className="h-48 flex items-center justify-center border border-dashed border-slate-600 rounded-lg">
              <span className="text-slate-500">Chart placeholder - Pattern occurrence timeline</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Related Trading Signals</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">BTC/KRW</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">BUY</span>
              </div>
              <p className="text-slate-500 text-sm">Strong pattern match</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">ETH/KRW</span>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">HOLD</span>
              </div>
              <p className="text-slate-500 text-sm">Moderate pattern match</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">XRP/KRW</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">BUY</span>
              </div>
              <p className="text-slate-500 text-sm">Weak pattern match</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
