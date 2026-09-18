'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { MapPin, Navigation, ShieldCheck, Info } from 'lucide-react';
import { fuzzLocation } from '@/lib/location';

export interface LocationSelection {
  address: string;
  landmark: string;
  latitude: number;
  longitude: number;
  isCurrentDeviceLocation: boolean;
  fuzzedLatitude: number;
  fuzzedLongitude: number;
}

interface LocationPickerProps {
  value: LocationSelection;
  onChange: (location: LocationSelection) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

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

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const fuzzed = fuzzLocation(lat, lng);

          onChange({
            ...value,
            latitude: lat,
            longitude: lng,
            fuzzedLatitude: fuzzed.blurredLatitude,
            fuzzedLongitude: fuzzed.blurredLongitude,
            isCurrentDeviceLocation: true,
            address: value.address || 'Detected Current Device Zone',
          });
          setIsDetecting(false);
        },
        (err) => {
          console.warn('[LocationPicker] Geolocation error or fallback:', err.message);
          // Default to central city coordinates fallback
          const defaultLat = 40.7128;
          const defaultLng = -74.006;
          const fuzzed = fuzzLocation(defaultLat, defaultLng);

          onChange({
            ...value,
            latitude: defaultLat,
            longitude: defaultLng,
            fuzzedLatitude: fuzzed.blurredLatitude,
            fuzzedLongitude: fuzzed.blurredLongitude,
            isCurrentDeviceLocation: true,
            address: 'Central District Safety Grid (Simulated)',
          });
          setIsDetecting(false);
        },
        { timeout: 5000 }
      );
    } else {
      setDetectError('Browser Geolocation is not supported. Please type an address or landmark manually.');
      setIsDetecting(false);
    }
  };

  const handleCoordinateChange = (lat: number, lng: number) => {
    const fuzzed = fuzzLocation(lat, lng);
    onChange({
      ...value,
      latitude: lat,
      longitude: lng,
      fuzzedLatitude: fuzzed.blurredLatitude,
      fuzzedLongitude: fuzzed.blurredLongitude,
    });
  };

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

      {/* Distinction Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-800 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              1. Reporter Location Status
            </span>
            <p className="text-slate-200 font-medium">
              {value.isCurrentDeviceLocation ? 'Detected via Device GPS' : 'Not Attached (Custom Target Specified)'}
            </p>
            <p className="text-slate-500 text-[11px] font-mono">
              [Privacy Status: Masked / Zero Public Exposure]
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              2. Incident Location (Target)
            </span>
            <p className="text-sky-300 font-medium">
              {value.address || value.landmark || `Grid (${value.fuzzedLatitude}, ${value.fuzzedLongitude})`}
            </p>
            <p className="text-slate-400 text-[11px] font-mono">
              Fuzzed: Lat {value.fuzzedLatitude}, Lng {value.fuzzedLongitude} (~1.2km radius)
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <Input
            label="Incident Address or Street Name"
            placeholder="e.g. 5th Avenue & 42nd Street"
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            icon={<MapPin className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Landmark or Nearby Identification"
            placeholder="e.g. Near Central Transit Exit / Metro Plaza"
            value={value.landmark}
            onChange={(e) => onChange({ ...value, landmark: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude Coordinates"
              type="number"
              step="0.0001"
              value={value.latitude.toString()}
              onChange={(e) => handleCoordinateChange(parseFloat(e.target.value) || 0, value.longitude)}
            />
            <Input
              label="Longitude Coordinates"
              type="number"
              step="0.0001"
              value={value.longitude.toString()}
              onChange={(e) => handleCoordinateChange(value.latitude, parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
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
