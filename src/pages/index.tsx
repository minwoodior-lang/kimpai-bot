import Head from "next/head";
import Layout from "@/components/Layout";
import Link from "next/link";

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>KimpAI - Kimchi Premium Analytics & AI Insights</title>
        <meta name="description" content="Track the Kimchi Premium in real-time with AI-powered analytics. Get trading signals, arbitrage opportunities, and market predictions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-slate-300 text-sm">Live Premium: +3.8%</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Track the Kimchi Premium
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Real-time analytics for Korean crypto markets. Get AI-powered trading signals, 
            arbitrage opportunities, and premium predictions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all shadow-lg shadow-blue-500/25"
            >
              Start Free Trial
            </Link>
            <Link
              href="/markets"
              className="border border-slate-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-slate-800 transition-all"
            >
              View Markets
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">+4.2%</div>
              <div className="text-slate-400">BTC Premium</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">+3.8%</div>
              <div className="text-slate-400">ETH Premium</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">₩1,325</div>
              <div className="text-slate-400">USD/KRW Rate</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-slate-400">Trading Pairs</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to trade smarter
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Powerful tools to monitor the Kimchi Premium and find profitable opportunities
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="📊"
              title="Real-time Premium Data"
              description="Track Kimchi Premium across Upbit, Bithumb, Korbit and global exchanges in real-time"
            />
            <FeatureCard 
              icon="🤖"
              title="AI Market Analysis"
              description="Get daily AI-powered insights, predictions, and trading signals based on historical patterns"
            />
            <FeatureCard 
              icon="🔔"
              title="Smart Alerts"
              description="Set custom alerts for premium thresholds, price targets, and arbitrage opportunities"
            />
            <FeatureCard 
              icon="💹"
              title="Arbitrage Scanner"
              description="Identify cross-exchange arbitrage opportunities with estimated profit calculations"
            />
            <FeatureCard 
              icon="📈"
              title="Pattern Recognition"
              description="AI-detected market patterns with historical accuracy and predictive signals"
            />
            <FeatureCard 
              icon="🌐"
              title="Multi-Exchange Coverage"
              description="Data from Korean and global exchanges with live USD/KRW FX rates"
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to start trading smarter?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join traders who use KimpAI to track the Kimchi Premium and find profitable opportunities
          </p>
          <Link
            href="/signup"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all shadow-lg shadow-blue-500/25"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}
