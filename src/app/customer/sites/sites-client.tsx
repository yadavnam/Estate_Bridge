'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, Building, ArrowRight, 
  Sparkles, CheckCircle2, ChevronRight, Eye 
} from 'lucide-react';

interface SitePropertyType {
  property_type: string;
}

interface SiteFacility {
  facility_name: string;
}

interface SiteMedia {
  file_url: string;
  file_type: string;
}

interface RegisteredSite {
  site_id: string;
  site_name: string;
  builder_name: string;
  address: string;
  city: string;
  area: string;
  locality: string;
  google_map_link: string | null;
  status: string;
  site_property_types: SitePropertyType[];
  site_facilities: SiteFacility[];
  site_media: SiteMedia[];
}

export default function SitesClient({ sites }: { sites: RegisteredSite[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedPropType, setSelectedPropType] = useState('All');
  const [selectedFacility, setSelectedFacility] = useState('All');

  // Dynamic lists for filters
  const cities = useMemo(() => {
    const list = new Set(sites.map(s => s.city));
    return ['All', ...Array.from(list)];
  }, [sites]);

  const propertyTypes = useMemo(() => {
    const list = new Set<string>();
    sites.forEach(s => s.site_property_types.forEach(pt => list.add(pt.property_type)));
    return ['All', ...Array.from(list)];
  }, [sites]);

  const facilities = useMemo(() => {
    const list = new Set<string>();
    sites.forEach(s => s.site_facilities.forEach(f => list.add(f.facility_name)));
    return ['All', ...Array.from(list)];
  }, [sites]);

  // Filtered Sites
  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      const matchesSearch = 
        site.site_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.builder_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.area.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = selectedCity === 'All' || site.city === selectedCity;

      const matchesPropType = selectedPropType === 'All' || 
        site.site_property_types.some(pt => pt.property_type === selectedPropType);

      const matchesFacility = selectedFacility === 'All' ||
        site.site_facilities.some(f => f.facility_name === selectedFacility);

      return matchesSearch && matchesCity && matchesPropType && matchesFacility;
    });
  }, [sites, searchQuery, selectedCity, selectedPropType, selectedFacility]);

  return (
    <div className="space-y-6">
      {/* Search and Filter Panel */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search bar */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by project name, builder, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* City filter */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-cyan-500 transition appearance-none cursor-pointer"
            >
              <option value="All">All Cities</option>
              {cities.filter(c => c !== 'All').map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Property Type filter */}
          <div className="relative">
            <select
              value={selectedPropType}
              onChange={(e) => setSelectedPropType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl py-3.5 px-4 text-white focus:outline-none focus:border-cyan-500 transition appearance-none cursor-pointer"
            >
              <option value="All">All Types</option>
              {propertyTypes.filter(pt => pt !== 'All').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Facilities Filter Row */}
        <div className="pt-4 border-t border-zinc-850/60 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">Nearby Facility:</span>
          {facilities.map(facility => (
            <button
              key={facility}
              onClick={() => setSelectedFacility(facility)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                selectedFacility === facility
                  ? 'bg-cyan-500/15 border-cyan-800 text-cyan-400'
                  : 'bg-zinc-950/20 border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {facility === 'All' ? 'All Facilities' : facility}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Results */}
      {filteredSites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => {
            const firstImg = site.site_media?.find(m => m.file_type?.toLowerCase().startsWith('image'))?.file_url;
            return (
              <div 
                key={site.site_id}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl hover:border-zinc-700/80 transition-all duration-300 flex flex-col justify-between group hover:shadow-2xl hover:shadow-cyan-500/5"
              >
                <div>
                  {/* Photo / Media Header */}
                  <div className="h-48 bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-850">
                    {firstImg ? (
                      <img 
                        src={firstImg} 
                        alt={site.site_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2 text-zinc-600">
                        <Building className="w-10 h-10 mx-auto opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block">No Media Registered</span>
                      </div>
                    )}
                    <span className="absolute top-4 left-4 px-2.5 py-0.5 bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                      {site.builder_name}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {site.site_name}
                      </h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="line-clamp-1">{site.locality}, {site.area}, {site.city}</span>
                      </p>
                    </div>

                    {/* Configurations */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Configurations</span>
                      <div className="flex flex-wrap gap-1.5">
                        {site.site_property_types?.map((pt, i) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-950 border border-zinc-850 rounded-md text-[10px] text-zinc-300">
                            {pt.property_type}
                          </span>
                        )) || <span className="text-xs text-zinc-600">No types listed</span>}
                      </div>
                    </div>

                    {/* Nearby Facilities */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Nearby Access</span>
                      <div className="flex flex-wrap gap-1">
                        {site.site_facilities?.slice(0, 3).map((f, i) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-950 text-cyan-400/80 rounded-md text-[10px] flex items-center gap-1 border border-cyan-950/30">
                            <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                            {f.facility_name}
                          </span>
                        ))}
                        {site.site_facilities?.length > 3 && (
                          <span className="text-[9px] font-bold text-zinc-500 px-1 py-0.5">
                            +{site.site_facilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card CTA Footer */}
                <div className="p-6 pt-0 border-t border-zinc-850/30">
                  <a
                    href={`/customer/sites/${site.site_id}`}
                    className="w-full mt-4 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer group-hover:border-cyan-800/60"
                  >
                    View Project Details
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-3xl space-y-3">
          <Building className="w-12 h-12 text-zinc-650 mx-auto" />
          <h3 className="font-bold text-lg text-zinc-300">No Builder Sites Match Your Search</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Try adjusting your search criteria or changing filters to look for other options.
          </p>
        </div>
      )}
    </div>
  );
}
