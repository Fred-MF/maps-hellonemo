import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Region, Network, Operator } from '../types/api';

interface BreadcrumbProps {
  region: Region | null;
  network: Network | null;
  operator: Operator | null;
  onSelectRegion: () => void;
  onSelectNetwork: () => void;
  onSelectOperator: () => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  region,
  network,
  operator,
  onSelectRegion,
  onSelectNetwork,
  onSelectOperator,
}) => {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      <button
        onClick={onSelectRegion}
        className={`px-3 py-1.5 rounded-full transition-colors ${
          !network ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {region ? region.name : 'Sélectionner une région'}
      </button>

      {region && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <button
            onClick={onSelectNetwork}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              network && !operator ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {network ? network.display_name || network.feed_id : 'Sélectionner un réseau'}
          </button>
        </>
      )}

      {network && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <button
            onClick={onSelectOperator}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              operator ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {operator ? operator.display_name || operator.name : 'Sélectionner un opérateur'}
          </button>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;