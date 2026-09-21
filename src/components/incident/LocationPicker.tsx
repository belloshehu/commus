'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { MapPin, Navigation, ShieldCheck, Info, Layers, Compass } from 'lucide-react';
import { fuzzLocation, DEFAULT_COMMUNITY_COORDINATES, resolveLocationDetails } from '@/lib/location';

export interface LocationSelection {
  address: string;
  landmark: string;
  latitude: number;
  longitude: number;
  isCurrentDeviceLocation: boolean;
  fuzzedLatitude: number;
  fuzzedLongitude: number;
  locationName?: string;
  state?: string;
  country?: string;
}

interface LocationPickerProps {
  value: LocationSelection;
  onChange: (location: LocationSelection) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  // Auto-detect browser GPS on mount if initial coordinates are unset or at foreign default
  useEffect(() => {
    if (
      !value.latitude ||
      !value.longitude ||
      (value.latitude === 40.7128 && value.longitude === -74.006)
    ) {
      detectCurrentGps();
    }
  }, []);

  const handleModeChange = (useCurrentGps: boolean) => {
    if (useCurrentGps) {
      detectCurrentGps();
    } else {
      onChange({
        ...value,
        isCurrentDeviceLocation: false,
      });
    }
  };

  const detectCurrentGps = () => {
    setIsDetecting(true);
    setDetectError(null);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const fuzzed = fuzzLocation(lat, lng);
          const resolved = resolveLocationDetails(lat, lng, value.address);

          onChange({
            ...value,
            latitude: lat,
            longitude: lng,
            fuzzedLatitude: fuzzed.blurredLatitude,
            fuzzedLongitude: fuzzed.blurredLongitude,
            isCurrentDeviceLocation: true,
            address: value.address || `${resolved.locationName}, ${resolved.state}`,
            locationName: resolved.locationName,
            state: resolved.state,
            country: resolved.country,
          });
          setIsDetecting(false);
        },
        (err) => {
          console.warn('[LocationPicker] Geolocation error or fallback:', err.message);
          const defaultLat = DEFAULT_COMMUNITY_COORDINATES.latitude;
          const defaultLng = DEFAULT_COMMUNITY_COORDINATES.longitude;
          const fuzzed = fuzzLocation(defaultLat, defaultLng);
          const resolved = resolveLocationDetails(
            defaultLat,
            defaultLng,
            DEFAULT_COMMUNITY_COORDINATES.address,
            DEFAULT_COMMUNITY_COORDINATES.locationName,
            DEFAULT_COMMUNITY_COORDINATES.state,
            DEFAULT_COMMUNITY_COORDINATES.country
          );

          onChange({
            ...value,
            latitude: defaultLat,
            longitude: defaultLng,
            fuzzedLatitude: fuzzed.blurredLatitude,
            fuzzedLongitude: fuzzed.blurredLongitude,
            isCurrentDeviceLocation: true,
            address: value.address || DEFAULT_COMMUNITY_COORDINATES.address,
            locationName: resolved.locationName,
            state: resolved.state,
            country: resolved.country,
          });
          setDetectError('Browser Geolocation unavailable or blocked. Applied active safety zone location.');
          setIsDetecting(false);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      const defaultLat = DEFAULT_COMMUNITY_COORDINATES.latitude;
      const defaultLng = DEFAULT_COMMUNITY_COORDINATES.longitude;
      const fuzzed = fuzzLocation(defaultLat, defaultLng);
      const resolved = resolveLocationDetails(
        defaultLat,
        defaultLng,
        DEFAULT_COMMUNITY_COORDINATES.address
      );

      onChange({
        ...value,
        latitude: defaultLat,
        longitude: defaultLng,
        fuzzedLatitude: fuzzed.blurredLatitude,
        fuzzedLongitude: fuzzed.blurredLongitude,
        isCurrentDeviceLocation: false,
        address: value.address || DEFAULT_COMMUNITY_COORDINATES.address,
        locationName: resolved.locationName,
        state: resolved.state,
        country: resolved.country,
      });
      setDetectError('Browser Geolocation is not supported. Please type an address or set coordinates manually.');
      setIsDetecting(false);
    }
  };

  const handleCoordinateChange = (lat: number, lng: number) => {
    const fuzzed = fuzzLocation(lat, lng);
    const resolved = resolveLocationDetails(lat, lng, value.address);
    onChange({
      ...value,
      latitude: lat,
      longitude: lng,
      fuzzedLatitude: fuzzed.blurredLatitude,
      fuzzedLongitude: fuzzed.blurredLongitude,
      locationName: resolved.locationName,
      state: resolved.state,
      country: resolved.country,
    });
  };

  const handleAddressChange = (newAddress: string) => {
    const resolved = resolveLocationDetails(value.latitude, value.longitude, newAddress);
    onChange({
      ...value,
      address: newAddress,
      locationName: resolved.locationName,
      state: resolved.state,
      country: resolved.country,
    });
  };

  // Embed map parameters
  const currentLat = value.latitude || DEFAULT_COMMUNITY_COORDINATES.latitude;
  const currentLng = value.longitude || DEFAULT_COMMUNITY_COORDINATES.longitude;
  const delta = 0.02;
  const bbox = `${currentLng - delta},${currentLat - delta},${currentLng + delta},${currentLat + delta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox
  )}&layer=mapnik&marker=${currentLat},${currentLng}`;

  const resolved = resolveLocationDetails(
    currentLat,
    currentLng,
    value.address,
    value.locationName,
    value.state,
    value.country
  );

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Banner */}
      <Alert type="info">
        <strong>REPORTER PRIVACY ASSURANCE:</strong> Your exact reporter location is <strong>NEVER</strong> stored or displayed publicly. Community feeds only display a fuzzed Geohash grid (~1.1km radius).
      </Alert>

      {/* Location Source Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleModeChange(true)}
          className={`p-4 rounded-xl border text-left transition-all ${
            value.isCurrentDeviceLocation
              ? 'bg-sky-950/40 border-sky-500/80 ring-1 ring-sky-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Navigation className={`w-4 h-4 ${value.isCurrentDeviceLocation ? 'text-sky-400' : 'text-slate-400'}`} />
            Incident is at My Current Location
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detects current device GPS and applies automatic 1.1km geohash fuzzing.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange(false)}
          className={`p-4 rounded-xl border text-left transition-all ${
            !value.isCurrentDeviceLocation
              ? 'bg-sky-950/40 border-sky-500/80 ring-1 ring-sky-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <MapPin className={`w-4 h-4 ${!value.isCurrentDeviceLocation ? 'text-sky-400' : 'text-slate-400'}`} />
            Specify Custom Incident Location
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Specify a separate street address, landmark, or custom coordinates.
          </p>
        </button>
      </div>

      {detectError && (
        <div className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-lg border border-amber-900/50 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          {detectError}
        </div>
      )}

      {/* Interactive Map Preview Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-4">
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>INCIDENT LOCATION MAP PREVIEW</span>
          </div>
          <span className="text-[11px] text-sky-300 font-mono">
            {resolved.formattedLocation}
          </span>
        </div>

        <div className="relative w-full h-[220px] bg-slate-950">
          <iframe
            title="Location Selection Map Preview"
            src={osmEmbedUrl}
            className="w-full h-full border-0 filter grayscale invert contrast-125 opacity-90"
            loading="lazy"
          />
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-sm p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 font-mono">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Pin Target: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}</span>
            </span>
            <span className="text-slate-400">
              Fuzzed Grid: {value.fuzzedLatitude.toFixed(2)}, {value.fuzzedLongitude.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Inputs Section */}
        <div className="p-4 space-y-4">
          <Input
            label="Incident Address or Street Name"
            placeholder="e.g. Broad Street & Marina Expressway"
            value={value.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            icon={<MapPin className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Landmark or Nearby Identification"
            placeholder="e.g. Near Central Transit Hub / Main Plaza"
            value={value.landmark}
            onChange={(e) => onChange({ ...value, landmark: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude Coordinates"
              type="number"
              step="0.0001"
              value={value.latitude ? value.latitude.toString() : ''}
              onChange={(e) => handleCoordinateChange(parseFloat(e.target.value) || 0, value.longitude)}
            />
            <Input
              label="Longitude Coordinates"
              type="number"
              step="0.0001"
              value={value.longitude ? value.longitude.toString() : ''}
              onChange={(e) => handleCoordinateChange(value.latitude, parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isDetecting}
              icon={<Navigation className="w-3.5 h-3.5 text-sky-400" />}
              onClick={detectCurrentGps}
            >
              Re-detect Device GPS Coordinates
            </Button>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              AES-256 Encrypted at Rest
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

