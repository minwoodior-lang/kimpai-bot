import Head from "next/head";
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export default function Home() {
  return (
    <>
      <Head>
        <title>KimpAI - Intelligent SaaS Dashboard</title>
        <meta name="description" content="KimpAI - Your intelligent SaaS platform for data-driven decisions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`${geistSans.variable} font-sans min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`}>
        <nav className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="text-xl font-bold text-white">KimpAI</span>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
                <a href="#about" className="text-slate-300 hover:text-white transition-colors">About</a>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-slate-300 hover:text-white transition-colors">Sign In</button>
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-slate-300 text-sm">Now in Public Beta</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Intelligent Analytics
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Powered by AI
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                Transform your data into actionable insights with our AI-powered dashboard. 
                Make smarter decisions faster with KimpAI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all shadow-lg shadow-blue-500/25">
                  Start Free Trial
                </button>
                <button className="border border-slate-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-slate-800 transition-all">
                  View Demo
                </button>
              </div>
            </div>
          </section>

          <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Everything you need
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                  Powerful features to help you manage and analyze your data effectively
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                  icon="📊"
                  title="Real-time Analytics"
                  description="Monitor your metrics in real-time with beautiful, interactive dashboards"
                />
                <FeatureCard 
                  icon="🤖"
                  title="AI Insights"
                  description="Get intelligent recommendations and predictions powered by machine learning"
                />
                <FeatureCard 
                  icon="🔒"
                  title="Enterprise Security"
                  description="Bank-grade encryption and compliance with industry standards"
                />
                <FeatureCard 
                  icon="⚡"
                  title="Lightning Fast"
                  description="Optimized performance with sub-second query responses"
                />
                <FeatureCard 
                  icon="🔗"
                  title="Easy Integrations"
                  description="Connect with 100+ tools and services seamlessly"
                />
                <FeatureCard 
                  icon="📱"
                  title="Mobile Ready"
                  description="Access your dashboard anywhere with our responsive design"
                />
              </div>
            </div>
          </section>

          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Join thousands of companies already using KimpAI to power their analytics
              </p>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all shadow-lg shadow-blue-500/25">
                Start Your Free Trial
              </button>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-700/50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="text-xl font-bold text-white">KimpAI</span>
              </div>
              <p className="text-slate-400 text-sm">
                © 2024 KimpAI. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
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
