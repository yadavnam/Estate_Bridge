'use client';

import React from 'react';
import { 
  Building2, MapPin, Sparkles, User, HelpCircle, 
  CheckCircle2, Compass, ShieldAlert, ArrowLeft, ArrowUpRight 
} from 'lucide-react';

interface Property {
  property_id: string;
  title: string;
  property_type: string;
  price: number;
  city: string;
  area: string;
  locality: string;
  area_size: number;
  bhk: string;
  facing: string;
  status: 'Active' | 'Inactive' | 'Sold';
  created_at: string;
  property_amenities: { amenity_name: string }[];
  property_facilities: { facility_name: string; distance: number }[];
  property_media: { file_url: string }[];
}

interface Match {
  request_id: string;
  match_score: number;
  status: string;
  created_at: string;
  requirements: {
    requirement_id: string;
    requirement_code: string;
    property_type: string;
    budget_min: number;
    budget_max: number;
    city: string;
    area: string;
    area_min: number;
    area_max: number;
    additional_notes: string;
    requirement_employee_assignments: {
      status: string;
    }[];
  };
}

export default function PropertyDetailsClient({ 
  property, 
  matches 
}: { 
  property: Property; 
  matches: Match[]; 
}) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25';
      case 'Sold':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700/60';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1 & 2: Property specs & media */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Title and main header */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
                {property.property_type} Configuration
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{property.title}</h1>
              <p className="text-zinc-400 text-xs flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                {property.locality}, {property.area}, {property.city}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${getStatusBadge(property.status)}`}>
              {property.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-zinc-950/40 p-4 border border-zinc-850 rounded-2xl text-center">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Price</span>
              <span className="text-white font-extrabold text-sm sm:text-base">₹{Number(property.price).toLocaleString()}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">BHK</span>
              <span className="text-white font-extrabold text-sm sm:text-base">{property.bhk} BHK</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Size</span>
              <span className="text-white font-extrabold text-sm sm:text-base">{property.area_size} Sq Ft</span>
            </div>
          </div>
        </div>

        {/* Media items */}
        {property.property_media && property.property_media.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Property Showcase Media</h3>
            <div className="grid grid-cols-2 gap-4">
              {property.property_media.map((med, idx) => (
                <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img
                    src={med.file_url}
                    alt={`Property media ${idx + 1}`}
                    className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specifications detail cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Amenities details */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
              Amenities & Inclusions
            </h3>
            {property.property_amenities && property.property_amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.property_amenities.map((amenity, idx) => (
                  <span 
                    key={idx}
                    className="bg-zinc-950 border border-zinc-850 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    {amenity.amenity_name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-xs">No specific amenities configured.</p>
            )}
          </div>

          {/* Facing & details */}
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-indigo-400" />
              Orientation & Architecture
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-850 pb-2">
                <span className="text-zinc-400 font-medium">Facing Direction</span>
                <span className="text-white font-bold">{property.facing}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-850 pb-2">
                <span className="text-zinc-400 font-medium">Registration Date</span>
                <span className="text-white font-bold">{new Date(property.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-medium">Security Vault Lock</span>
                <span className="text-emerald-400 font-bold">RLS Active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Nearby Facilities */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4">
          <h3 className="font-bold text-white text-sm">Nearby Infrastructure Distances</h3>
          {property.property_facilities && property.property_facilities.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {property.property_facilities.map((fac, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl text-center space-y-1">
                  <span className="text-zinc-500 font-bold block text-[9px] uppercase tracking-wider">{fac.facility_name}</span>
                  <span className="text-white font-extrabold text-sm">{fac.distance} KM</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-xs">No nearby facilities distances logged.</p>
          )}
        </div>

      </div>

      {/* Column 3: Matches directory (obfuscated customer names) */}
      <div className="space-y-6">
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
            <h3 className="font-bold text-white text-sm">Engine Matches</h3>
            <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 border border-cyan-500/20 rounded-md text-[10px] font-bold">
              {matches.length} Matches
            </span>
          </div>

          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => {
                const req = match.requirements;
                
                const activeAssignment = req?.requirement_employee_assignments?.find(
                  (a) => a.status === 'Active'
                );
                const hasCoordinator = !!activeAssignment;

                return (
                  <div 
                    key={match.request_id}
                    className="p-4 bg-zinc-950/60 border border-zinc-850 hover:border-zinc-750 rounded-2xl space-y-3 transition-colors"
                  >
                    
                    {/* Header: Score & Obfuscated customer ID */}
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">Obfuscated ID</span>
                        <span className="text-zinc-200 font-bold text-xs">Customer {req?.requirement_code || 'N/A'}</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg">
                        {match.match_score}% Match
                      </span>
                    </div>

                    {/* Requirement details */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-zinc-900/50 p-2 border border-zinc-850/60 rounded-xl">
                      <div>
                        <span className="text-zinc-500 block uppercase font-medium">Budget Max</span>
                        <span className="text-zinc-300 font-bold">₹{Number(req?.budget_max).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase font-medium">BHK configuration</span>
                        <span className="text-zinc-300 font-bold">{req?.property_type}</span>
                      </div>
                    </div>

                    {/* Coordination details */}
                    <div className="pt-2 border-t border-zinc-850/40 space-y-1">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">Coordination Status</span>
                      {hasCoordinator ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>Coordinator Assigned</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] italic">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Pending Assignment</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-550 border border-dashed border-zinc-850 rounded-2xl space-y-2">
              <ShieldAlert className="w-8 h-8 text-zinc-650 mx-auto" />
              <p className="text-zinc-400 text-xs font-bold">No active matches found</p>
              <p className="text-zinc-550 text-[10px] max-w-[180px] mx-auto leading-normal">
                Our matching engine automatically scans requirements and evaluates them when buyers create lists.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
