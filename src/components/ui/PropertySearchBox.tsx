'use client';

import { Search, MapPin, Home } from 'lucide-react';

export default function PropertySearchBox() {
  return (
    <div className="glass-card w-full max-w-4xl mx-auto rounded-2xl p-4 md:p-6 mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Location Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
            placeholder="City, Neighborhood, or Address"
          />
        </div>

        {/* Property Type */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Home className="h-5 w-5 text-gray-400" />
          </div>
          <select className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all">
            <option value="" disabled selected className="text-gray-400">Property Type</option>
            <option value="apartment" className="bg-zinc-900">Apartment</option>
            <option value="villa" className="bg-zinc-900">Villa</option>
            <option value="commercial" className="bg-zinc-900">Commercial</option>
            <option value="plot" className="bg-zinc-900">Plot / Land</option>
          </select>
        </div>

        {/* Search Button */}
        <button className="bg-gold hover:bg-gold-hover text-black px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]">
          <Search className="h-5 w-5" />
          Search
        </button>

      </div>
    </div>
  );
}
