import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowRight, Download, BarChart2, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
           <div className="container mx-auto px-4 text-center">
             <div className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-sm font-medium text-brand mb-8">
               <span className="flex h-2 w-2 rounded-full bg-brand mr-2 animate-pulse"></span>
               New EAs Added Daily
             </div>
             
             <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-7xl mb-6">
               Master the Markets with <span className="gradient-text">Algorithmic Precision</span>
             </h1>
             
             <p className="mx-auto max-w-2xl text-lg text-zinc-400 mb-10">
               Download 500+ professional Expert Advisors, indicators, and trading systems. 
               Backtested, verified, and ready for MT4 & MT5.
             </p>
             
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link href="/downloads" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-brand px-8 py-4 text-base font-semibold text-white hover:bg-brand-dark transition-all">
                 Browse Robots <ArrowRight className="ml-2 h-5 w-5" />
               </Link>
               <Link href="/blog" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all">
                 Read Guides
               </Link>
             </div>
           </div>
        </section>
        
        {/* Features Grid */}
        <section className="py-20 bg-surface-50">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="glass-panel p-8 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Download className="h-10 w-10 text-brand mb-6" />
                 <h3 className="text-xl font-bold text-white mb-3">Free Downloads</h3>
                 <p className="text-zinc-400">Access a massive library of EAs and indicators for MetaTrader 4 and 5 platforms.</p>
              </div>
              
              <div className="glass-panel p-8 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <BarChart2 className="h-10 w-10 text-purple-400 mb-6" />
                 <h3 className="text-xl font-bold text-white mb-3">Live Signals</h3>
                 <p className="text-zinc-400">Follow high-performance trading signals with verified Myfxbook track records.</p>
              </div>
              
              <div className="glass-panel p-8 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <BookOpen className="h-10 w-10 text-emerald-400 mb-6" />
                 <h3 className="text-xl font-bold text-white mb-3">Education</h3>
                 <p className="text-zinc-400">Deep dive into algorithmic trading strategies, backtesting, and optimization.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
