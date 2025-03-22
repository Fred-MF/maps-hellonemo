import React, { useMemo } from 'react';
import { Network } from '../types/api';
import { Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NetworkFilterProps {
  networks: Network[];
  selectedNetwork: Network | null;
  onSelectNetwork: (network: Network) => void;
}

const NetworkFilter: React.FC<NetworkFilterProps> = ({
  networks,
  selectedNetwork,
  onSelectNetwork
}) => {
  const navigate = useNavigate();

  // Dédupliquer et grouper les réseaux par type (régional/urbain)
  const { regionalNetworks, urbanNetworks } = useMemo(() => {
    const networkMap = new Map<string, Network>();
    
    // Traiter uniquement les réseaux disponibles
    networks
      .filter(network => network.is_available)
      .forEach(network => {
        const key = network.display_name?.toLowerCase() || network.name.toLowerCase();
        
        if (!networkMap.has(key)) {
          networkMap.set(key, {
            ...network,
            operators: []
          });
        }

        const existingNetwork = networkMap.get(key)!;
        
        // Fusionner les opérateurs
        network.operators?.forEach(operator => {
          if (!existingNetwork.operators?.some(existing => existing.id === operator.id)) {
            existingNetwork.operators = [...(existingNetwork.operators || []), operator];
          }
        });
      });

    // Convertir la Map en tableau et trier
    const allNetworks = Array.from(networkMap.values());

    // Fonction pour déterminer si un réseau est régional
    const isRegionalNetwork = (network: Network) => {
      const name = (network.display_name || network.name).toLowerCase();
      return name.includes('région') || 
             name.includes('regional') || 
             name.includes('départemental') ||
             name.includes('interurbain') ||
             name.includes('cars') ||
             name.includes('ter');
    };

    // Séparer les réseaux en deux groupes
    const regional = allNetworks
      .filter(isRegionalNetwork)
      .sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name));

    const urban = allNetworks
      .filter(n => !isRegionalNetwork(n))
      .sort((a, b) => (a.display_name || a.name).localeCompare(b.display_name || b.name));

    return {
      regionalNetworks: regional,
      urbanNetworks: urban
    };
  }, [networks]);

  const handleNetworkClick = (network: Network) => {
    onSelectNetwork(network);
    
    // Si le réseau a plusieurs opérateurs, naviguer vers la page de détail du réseau
    if (network.operators && network.operators.length > 1) {
      const networkName = encodeURIComponent((network.display_name || network.name).replace(/\s+/g, '-').toLowerCase());
      navigate(`/reseau/${networkName}?region=${network.region_id}`);
    }
  };

  const renderNetworkButton = (network: Network) => (
    <button
      key={network.id}
      onClick={() => handleNetworkClick(network)}
      className={`
        p-3 rounded-lg text-left transition-colors
        ${selectedNetwork?.id === network.id
          ? 'bg-green-600 text-white ring-2 ring-offset-2 ring-green-600'
          : 'bg-white hover:bg-green-50 border border-gray-200'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <div className="truncate flex-1">
          <div className="font-medium truncate">{network.display_name || network.name}</div>
        </div>
        {network.operators && network.operators.length > 0 && (
          <div className="flex items-center">
            <div className={`
              text-xs px-2 py-1 rounded-full
              ${selectedNetwork?.id === network.id
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600'
              }
            `}>
              {network.operators.length} op.
            </div>
            {network.operators.length > 1 && (
              <ChevronRight className={`ml-2 h-4 w-4 ${
                selectedNetwork?.id === network.id
                  ? 'text-white'
                  : 'text-gray-400'
              }`} />
            )}
          </div>
        )}
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Réseaux régionaux */}
      {regionalNetworks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Building2 className="mr-2" size={20} />
            Réseaux régionaux et interurbains
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {regionalNetworks.map(renderNetworkButton)}
          </div>
        </div>
      )}

      {/* Réseaux urbains */}
      {urbanNetworks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center mt-8">
            <Building2 className="mr-2" size={20} />
            Réseaux urbains
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urbanNetworks.map(renderNetworkButton)}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkFilter;