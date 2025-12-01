import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-surface-50/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
          <span className="text-brand">Forex</span>Factory
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <Link href="/blog" className="hover:text-brand transition-colors">Blog</Link>
          <Link href="/downloads" className="hover:text-brand transition-colors">Downloads</Link>
          <Link href="/signals" className="hover:text-brand transition-colors">Signals</Link>
        </div>

        <div className="flex items-center gap-4">
           <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white">
             Login
           </Link>
           <Link href="/register" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark transition-colors">
             Get Started
           </Link>
        </div>
      </div>
    </nav>
  );
}
