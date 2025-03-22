import React from 'react';
import { Region } from '../types/api';
import { MapPin } from 'lucide-react';

interface RegionFilterProps {
  regions: Region[];
  selectedRegion: Region | null;
  onSelectRegion: (region: Region) => void;
}

const RegionFilter: React.FC<RegionFilterProps> = ({
  regions,
  selectedRegion,
  onSelectRegion
}) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <MapPin className="mr-2" size={20} />
        Sélectionner une région
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => onSelectRegion(region)}
            className={`p-4 rounded-lg text-left transition-colors ${
              selectedRegion?.id === region.id
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-blue-50 border border-gray-200'
            }`}
          >
            <div className="font-medium">{region.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RegionFilter;