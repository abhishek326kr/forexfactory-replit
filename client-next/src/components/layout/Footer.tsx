import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface-50 py-12">
      <div className="container mx-auto px-4 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-bold text-xl text-white mb-4">
            <span className="text-brand">Forex</span>Factory
          </div>
          <p className="text-sm text-zinc-400">
            Premium trading tools and educational resources for the modern algorithmic trader.
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold text-white mb-4">Platform</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link href="/downloads" className="hover:text-brand">Expert Advisors</Link></li>
            <li><Link href="/signals" className="hover:text-brand">Signals</Link></li>
            <li><Link href="/blog" className="hover:text-brand">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Support</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link href="/contact" className="hover:text-brand">Contact Us</Link></li>
            <li><Link href="/faq" className="hover:text-brand">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Legal</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><Link href="/privacy" className="hover:text-brand">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-brand">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-12 border-t border-white/5 pt-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
