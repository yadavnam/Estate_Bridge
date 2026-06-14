import Link from 'next/link';
import { Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-6 w-6 text-gold" />
              <span className="text-xl font-bold tracking-wider text-white">ESTATE<span className="text-gold">BRIDGE</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              The premier platform connecting elite real estate dealers with discerning buyers. Discover luxury, trust, and exclusivity.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-gold transition-colors"><Globe className="h-5 w-5" /></Link>
              <Link href="#" className="text-gray-400 hover:text-gold transition-colors"><Mail className="h-5 w-5" /></Link>
              <Link href="#" className="text-gray-400 hover:text-gold transition-colors"><Phone className="h-5 w-5" /></Link>
              <Link href="#" className="text-gray-400 hover:text-gold transition-colors"><MapPin className="h-5 w-5" /></Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Platform</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Browse Properties</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Find Dealers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing Plans</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Market Insights</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Company</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Careers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Contact</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Partners</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Legal</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookie Policy</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Estate Bridge. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-gray-500 text-sm">Mumbai</span>
            <span className="text-gray-700 text-sm">•</span>
            <span className="text-gray-500 text-sm">Delhi</span>
            <span className="text-gray-700 text-sm">•</span>
            <span className="text-gray-500 text-sm">Bangalore</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
