'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDealerProperty } from '@/app/actions/dealer';
import { Building2, Sparkles, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

const AMENITIES_LIST = [
  'Swimming Pool',
  'Gym',
  'Club House',
  'Power Backup',
  '24/7 Security',
  'Reserved Parking',
  'Lift',
  'Garden'
];

const FACILITY_TYPES = [
  'School',
  'Hospital',
  'Metro Station',
  'Supermarket'
];

const MOCK_IMAGE_OPTIONS = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80'
];

export default function NewPropertyForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [locality, setLocality] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [bhk, setBhk] = useState('3');
  const [facing, setFacing] = useState('East');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [facilitiesDistances, setFacilitiesDistances] = useState<Record<string, string>>({
    'School': '1.2',
    'Hospital': '2.5',
    'Metro Station': '0.8',
    'Supermarket': '0.5'
  });
  const [useMockMedia, setUseMockMedia] = useState(true);

  const toggleAmenity = (name: string) => {
    setSelectedAmenities(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const handleDistanceChange = (facility: string, val: string) => {
    setFacilitiesDistances(prev => ({
      ...prev,
      [facility]: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic validation
    if (!title.trim() || !price || !city.trim() || !area.trim() || !locality.trim() || !areaSize) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const priceNum = parseFloat(price);
    const sizeNum = parseFloat(areaSize);

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('Please enter a valid price greater than 0.');
      return;
    }

    if (isNaN(sizeNum) || sizeNum <= 0) {
      setErrorMsg('Please enter a valid area size greater than 0.');
      return;
    }

    setSubmitting(true);

    // Prepare facilities payload
    const facilitiesPayload = Object.entries(facilitiesDistances)
      .filter(([_, dist]) => dist.trim() !== '')
      .map(([name, dist]) => ({
        facility_name: name,
        distance: parseFloat(dist) || 0
      }));

    // Media
    const mediaUrls = useMockMedia ? MOCK_IMAGE_OPTIONS : [];

    const res = await createDealerProperty({
      title,
      propertyType,
      price: priceNum,
      city,
      area,
      locality,
      areaSize: sizeNum,
      bhk,
      facing,
      description,
      amenities: selectedAmenities,
      facilities: facilitiesPayload,
      mediaUrls
    });

    if (res.success) {
      setSuccessMsg('Property successfully listed in your Private Bank.');
      setTimeout(() => {
        router.push('/dealer/properties');
        router.refresh();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to list property.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button and title */}
      <div className="flex items-center gap-4">
        <a 
          href="/dealer/properties"
          className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Add Private Listing</h1>
          <p className="text-zinc-400 text-sm">Upload a new property to your partner bank. All records are shielded by RLS.</p>
        </div>
      </div>

      {/* Message Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-955/30 border border-red-800/40 rounded-2xl flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-955/30 border border-emerald-800/40 rounded-2xl flex items-start gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-8">
        
        {/* Section 1: Basic specifications */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Key Details & Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Property Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Skyline Heights 3BHK Premium"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Property Type *</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              >
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Plot">Plot</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Price (INR) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 12500000"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Area Size (sq. ft.) *</label>
              <input
                type="number"
                required
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value)}
                placeholder="e.g. 1850"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">BHK Configuration</label>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5 BHK</option>
                <option value="Plot">Plot/None</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Facing Direction</label>
              <select
                value={facing}
                onChange={(e) => setFacing(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              >
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="North-East">North-East</option>
                <option value="North-West">North-West</option>
                <option value="South-East">South-East</option>
                <option value="South-West">South-West</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Location data */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <span className="p-1 bg-cyan-500/10 text-cyan-400 rounded-md block text-xs">LOC</span>
            <h3 className="font-bold text-white text-base">Geographic Coordinates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Area / Suburb *</label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Whitefield"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Locality / Address *</label>
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. ITPL Main Road"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Amenities */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Amenities & Services</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {AMENITIES_LIST.map((name) => {
              const active = selectedAmenities.includes(name);
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => toggleAmenity(name)}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-between text-left cursor-pointer ${
                    active 
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                      : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <span>{name}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Facilities distances */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded-md block text-xs">FAC</span>
            <h3 className="font-bold text-white text-base">Nearby Infrastructure (Distances in KM)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {FACILITY_TYPES.map((facility) => (
              <div key={facility} className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 block">{facility}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={facilitiesDistances[facility] || ''}
                    onChange={(e) => handleDistanceChange(facility, e.target.value)}
                    placeholder="Distance"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 pr-10 text-sm focus:outline-none focus:border-cyan-500 transition text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 uppercase">KM</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Listing Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed features, specifications, view orientation, or developer reputation details..."
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500 transition text-white resize-none"
          />
        </div>

        {/* Media Option */}
        <div className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-300">Generate high-fidelity architectural demonstration media?</span>
          <button
            type="button"
            onClick={() => setUseMockMedia(!useMockMedia)}
            className={`px-4 py-2 rounded-xl border text-[10px] uppercase font-extrabold transition cursor-pointer ${
              useMockMedia 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            {useMockMedia ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Submit action buttons */}
        <div className="pt-6 border-t border-zinc-850/60 flex flex-col sm:flex-row justify-end items-center gap-4">
          <a
            href="/dealer/properties"
            className="w-full sm:w-auto text-center border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold py-3 px-6 rounded-xl text-xs transition cursor-pointer"
          >
            Cancel and Return
          </a>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/10 cursor-pointer text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Submitting Listing...
              </>
            ) : (
              'Publish Listing'
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
