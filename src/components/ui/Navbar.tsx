import Link from 'next/link';
import { Building2, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <Building2 className="h-8 w-8 text-gold" />
            <span className="text-2xl font-bold tracking-wider text-white">ESTATE<span className="text-gold">BRIDGE</span></span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide">Buy</Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide">Rent</Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide">Sell</Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide">Dealers</Link>
          </div>

          {/* Login / Auth */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:flex items-center gap-2 text-gray-300 hover:text-gold transition-colors font-medium">
              <User className="h-5 w-5" />
              Sign In
            </Link>
            <Link href="/signup" className="bg-gold hover:bg-gold-hover text-black px-6 py-2.5 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              Get Started
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}
