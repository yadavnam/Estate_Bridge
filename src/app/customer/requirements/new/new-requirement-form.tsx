'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitRequirement } from '@/app/actions/customer';
import { 
  ClipboardList, Landmark, Maximize, CheckSquare, 
  MapPin, ShieldAlert, Sparkles, Building2, ArrowRight
} from 'lucide-react';

const PROPERTY_TYPES = [
  'Apartment', 'Villa', 'Penthouse', 'Independent House', 
  'Plot', 'Commercial Office', 'Retail Shop', 'Warehouse'
];

const FURNISHING_STATES = [
  'Fully Furnished', 'Semi Furnished', 'Unfurnished'
];

const AMENITIES_OPTIONS = [
  'Swimming Pool', 'Gym', 'Clubhouse', 'Covered Parking', 
  'Power Backup', '24/7 Security', 'Jogging Track', 'Childrens Play Area'
];

const FACILITIES_OPTIONS = [
  'School', 'Hospital', 'Metro Station', 'Shopping Mall', 
  'Supermarket', 'Airport', 'Highway Access'
];

export default function NewRequirementForm({ defaultCity }: { defaultCity: string }) {
  const router = useRouter();
  
  // Form State
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPES[0]);
  const [budgetMin, setBudgetMin] = useState<number>(0);
  const [budgetMax, setBudgetMax] = useState<number>(0);
  const [city, setCity] = useState(defaultCity);
  const [area, setArea] = useState('');
  const [areaMin, setAreaMin] = useState<number>(0);
  const [areaMax, setAreaMax] = useState<number>(0);
  const [furnishing, setFurnishing] = useState(FURNISHING_STATES[0]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // UX State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAmenityToggle = (name: string) => {
    setSelectedAmenities(prev => 
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const handleFacilityToggle = (name: string) => {
    setSelectedFacilities(prev => 
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Basic Validation
    if (budgetMin < 0 || budgetMax <= 0 || budgetMin >= budgetMax) {
      setErrorMsg('Please specify a valid budget range where Max budget is greater than Min budget.');
      setLoading(false);
      return;
    }

    if (areaMin < 0 || areaMax <= 0 || areaMin >= areaMax) {
      setErrorMsg('Please specify a valid area size range where Max size is greater than Min size.');
      setLoading(false);
      return;
    }

    const res = await submitRequirement({
      propertyType,
      budgetMin,
      budgetMax,
      city,
      area,
      areaMin,
      areaMax,
      furnishing,
      amenities: selectedAmenities,
      facilities: selectedFacilities,
      additionalNotes: additionalNotes || undefined,
    });

    if (res.success) {
      router.push('/customer/requirements');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Failed to submit requirement.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl relative z-10 text-white">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl">
            <ClipboardList className="w-6 h-6 text-black" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Search Specs</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Submit Requirement</h1>
        <p className="text-zinc-400 text-sm">
          Specify your exact property parameters. Once submitted, our matching engine will link matching dealer properties.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-red-300 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Row 1: Property Type & Furnishing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition"
            >
              {PROPERTY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Furnishing Specification</label>
            <select
              value={furnishing}
              onChange={(e) => setFurnishing(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-cyan-500 transition"
            >
              {FURNISHING_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Location Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">City</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                required
                disabled={loading}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Preferred Area / Locality</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                required
                disabled={loading}
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Baner"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Budget Range */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Budget Range (₹)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="number"
                required
                min={0}
                disabled={loading}
                value={budgetMin || ''}
                onChange={(e) => setBudgetMin(parseInt(e.target.value) || 0)}
                placeholder="Min Budget"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="number"
                required
                min={1}
                disabled={loading}
                value={budgetMax || ''}
                onChange={(e) => setBudgetMax(parseInt(e.target.value) || 0)}
                placeholder="Max Budget"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Size Range */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Area Size Range (sq. ft.)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="relative">
              <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="number"
                required
                min={0}
                disabled={loading}
                value={areaMin || ''}
                onChange={(e) => setAreaMin(parseInt(e.target.value) || 0)}
                placeholder="Min Size"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <div className="relative">
              <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="number"
                required
                min={1}
                disabled={loading}
                value={areaMax || ''}
                onChange={(e) => setAreaMax(parseInt(e.target.value) || 0)}
                placeholder="Max Size"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Checkboxes: Amenities */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-4.5 h-4.5 text-cyan-400" />
            Select Desired Amenities
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AMENITIES_OPTIONS.map(amenity => (
              <label 
                key={amenity}
                className={`p-3 border rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition select-none ${
                  selectedAmenities.includes(amenity)
                    ? 'bg-cyan-950/20 border-cyan-800/80 text-cyan-300'
                    : 'bg-zinc-950/30 border-zinc-850 text-zinc-400 hover:text-white'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                />
                {amenity}
              </label>
            ))}
          </div>
        </div>

        {/* Checkboxes: Nearby Facilities */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-4.5 h-4.5 text-indigo-400" />
            Select Preferred Nearby Facilities
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FACILITIES_OPTIONS.map(facility => (
              <label 
                key={facility}
                className={`p-3 border rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition select-none ${
                  selectedFacilities.includes(facility)
                    ? 'bg-indigo-950/20 border-indigo-800/80 text-indigo-300'
                    : 'bg-zinc-950/30 border-zinc-850 text-zinc-400 hover:text-white'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedFacilities.includes(facility)}
                  onChange={() => handleFacilityToggle(facility)}
                />
                {facility}
              </label>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Additional Preferences / Notes</label>
          <textarea
            disabled={loading}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Describe specific preferences (e.g., East facing, high floor, Vaastu compliant)"
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-indigo-500/10 disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Saving Requirement Specifications...' : 'Submit Specs & Run Matches'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
