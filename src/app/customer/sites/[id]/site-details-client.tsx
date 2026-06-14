'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookSiteVisit } from '@/app/actions/customer';
import { 
  MapPin, Building, Calendar, Clock, ArrowRight, 
  Sparkles, CheckCircle2, ShieldAlert, Image, ExternalLink
} from 'lucide-react';

interface SitePropertyType {
  property_type: string;
}

interface SiteFacility {
  facility_name: string;
}

interface SiteMedia {
  media_id: string;
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

export default function SiteDetailsClient({ site }: { site: RegisteredSite }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');

  // Media state
  const [activeMedia, setActiveMedia] = useState<string | null>(
    site.site_media?.find(m => m.file_type?.toLowerCase().startsWith('image'))?.file_url || null
  );

  const handleBookVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await bookSiteVisit({
      siteId: site.site_id,
      visitDate,
      visitTime,
    });

    if (res.success) {
      setSuccessMsg('Your site visit has been requested successfully! You can track its status in the Visits Tracker.');
      setVisitDate('');
      setVisitTime('');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to schedule site visit.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-850 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-400 rounded-lg text-xs font-bold uppercase tracking-wider">
              {site.builder_name}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider">
              {site.status}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{site.site_name}</h1>
          <p className="text-zinc-400 text-sm flex items-center gap-1.5 mt-1.5">
            <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>{site.locality}, {site.area}, {site.city}</span>
          </p>
        </div>

        {site.google_map_link && (
          <a
            href={site.google_map_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950 py-2.5 px-4 rounded-xl transition cursor-pointer"
          >
            Google Maps Location
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Details and Media */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Media Showcase */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl p-6 space-y-4 shadow-xl">
            <div className="h-96 bg-zinc-950 rounded-2xl overflow-hidden relative flex items-center justify-center border border-zinc-850">
              {activeMedia ? (
                <img 
                  src={activeMedia} 
                  alt={site.site_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8 text-zinc-600">
                  <Image className="w-12 h-12 mx-auto opacity-40 mb-2" />
                  <span className="text-xs font-semibold uppercase tracking-wider">No Project Images Available</span>
                </div>
              )}
            </div>

            {/* Media Gallery Grid */}
            {site.site_media && site.site_media.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {site.site_media
                  .filter(m => m.file_type?.toLowerCase().startsWith('image'))
                  .map((media) => (
                    <button
                      key={media.media_id}
                      onClick={() => setActiveMedia(media.file_url)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border shrink-0 transition ${
                        activeMedia === media.file_url 
                          ? 'border-cyan-500 shadow-md shadow-cyan-500/10' 
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <img 
                        src={media.file_url} 
                        alt="site media thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Project Information */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-white border-b border-zinc-850 pb-3">Project Specifications</h3>

            {/* Address */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Site Address</span>
              <p className="text-zinc-200 text-sm bg-zinc-950 border border-zinc-850/60 p-4 rounded-2xl leading-relaxed">
                {site.address}
              </p>
            </div>

            {/* Configurations & Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Property Types</span>
                <div className="flex flex-wrap gap-2">
                  {site.site_property_types && site.site_property_types.length > 0 ? (
                    site.site_property_types.map((pt, i) => (
                      <span key={i} className="px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-200 font-semibold flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-cyan-400" />
                        {pt.property_type}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500">Unspecified property configurations.</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Nearby Accessibilities</span>
                <div className="flex flex-wrap gap-2">
                  {site.site_facilities && site.site_facilities.length > 0 ? (
                    site.site_facilities.map((f, i) => (
                      <span key={i} className="px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-200 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        {f.facility_name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-550">No facility data mapped.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Form */}
        <div className="space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-850 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6 border-zinc-800/80">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Workflow 2 Visit
              </span>
              <h3 className="text-lg font-bold text-white">Book Direct Site Visit</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Schedule a direct builder site inspection. This booking is direct and does not require an active property requirement.
              </p>
            </div>

            {/* Notification Alerts */}
            {errorMsg && (
              <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start gap-3 text-red-300 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-start gap-3 text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookVisit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Preferred Date</label>
                <input
                  type="date"
                  required
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Preferred Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="time"
                    required
                    disabled={loading}
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                {loading ? 'Requesting site slot...' : 'Request Site Visit'}
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
