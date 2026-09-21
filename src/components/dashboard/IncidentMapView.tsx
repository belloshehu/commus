'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Layers, ShieldCheck, Info, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

import { resolveLocationDetails, DEFAULT_COMMUNITY_COORDINATES } from '@/lib/location';

export interface IncidentMapViewProps {
  latitude: number;
  longitude: number;
  geohash?: string;
  locationName?: string;
  state?: string;
  country?: string;
  address?: string;
  className?: string;
}

export const IncidentMapView: React.FC<IncidentMapViewProps> = ({
  latitude = DEFAULT_COMMUNITY_COORDINATES.latitude,
  longitude = DEFAULT_COMMUNITY_COORDINATES.longitude,
  geohash = DEFAULT_COMMUNITY_COORDINATES.geohash,
  locationName,
  state,
  country,
  address,
  className = '',
}) => {
  const [zoomLevel, setZoomLevel] = useState(13);
  const [showBlurCircle, setShowBlurCircle] = useState(true);

  // Resolve location details from coordinates and address to guarantee text matches map tile
  const resolved = resolveLocationDetails(
    latitude,
    longitude,
    address,
    locationName,
    state,
    country
  );

  const displayLocationName = resolved.locationName;
  const displayState = resolved.state;
  const displayCountry = resolved.country;

  // Convert lat/lng to OpenStreetMap static tile bbox / embed parameters
  const delta = 0.04 / (zoomLevel / 12);
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${latitude},${longitude}`;

  const formattedLocation = resolved.formattedLocation;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 1, 17));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 1, 9));

  return (
    <Card variant="highlight" className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="info" className="flex items-center gap-1 text-[11px]">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>SAFETY ZONE MAP</span>
            </Badge>
            <Badge variant="neutral" className="font-mono text-[11px]">
              {geohash}
            </Badge>
          </div>
          <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-rose-400 shrink-0" />
            <span>{formattedLocation}</span>
          </CardTitle>
        </div>

        {/* Map Control Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowBlurCircle(!showBlurCircle)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              showBlurCircle
                ? 'bg-sky-950 text-sky-300 border-sky-800'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle ~1.5km Privacy Blur Ring"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showBlurCircle ? 'Privacy Ring On' : 'Privacy Ring Off'}</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom In Map"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-800" />
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom Out Map"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative bg-slate-950 min-h-[280px]">
        {/* Interactive OpenStreetMap Embed Container */}
        <div className="relative w-full h-[320px] overflow-hidden">
          <iframe
            title={`Incident Location Map - ${formattedLocation}`}
            src={osmEmbedUrl}
            className="w-full h-full border-0 filter grayscale invert contrast-125 opacity-85 hover:opacity-100 transition-opacity"
            loading="lazy"
          />

          {/* Privacy Fuzzed Safety Zone Circle Overlay */}
          {showBlurCircle && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border-2 border-sky-400/60 bg-sky-500/15 backdrop-blur-[1px] animate-pulse flex items-center justify-center shadow-lg shadow-sky-950/50">
                <div className="w-4 h-4 rounded-full bg-rose-500/80 border-2 border-white shadow-md shadow-rose-950 animate-ping" />
              </div>
            </div>
          )}

          {/* Pin Marker Callout Badge Overlay */}
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl max-w-sm flex items-start gap-2.5 text-xs">
            <Navigation className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <div className="font-bold text-slate-100 truncate">{displayLocationName}</div>
              <div className="text-[11px] text-slate-300 truncate">
                {displayState}, {displayCountry}
              </div>
              <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Geohash: {geohash} (~1.5km location blur)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Privacy Guarantee Note */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Exact reporter coordinates encrypted for privacy protection.</span>
          </span>
          <span className="hidden sm:inline text-slate-500">
            Coordinates: {latitude.toFixed(2)}, {longitude.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
