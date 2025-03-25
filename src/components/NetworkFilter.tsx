import React, { useMemo } from 'react';
import { Network, Operator } from '../types/api';
import { Building2, ChevronRight } from 'lucide-react';

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
  // Dédupliquer et grouper les réseaux par type (régional/urbain)
  const { regionalNetworks, urbanNetworks } = useMemo(() => {
    const networkMap = new Map<string, Network>();
    
    // Traiter uniquement les réseaux disponibles avec au moins un opérateur actif
    networks
      .filter(network => {
        // Grouper les opérateurs actifs par display_name
        const operatorGroups = new Map<string, Operator[]>();
        network.operators?.forEach(op => {
          if (op.is_active) {
            const key = op.display_name || op.name;
            if (!operatorGroups.has(key)) {
              operatorGroups.set(key, []);
            }
            operatorGroups.get(key)!.push(op);
          }
        });
        
        return network.is_available && operatorGroups.size > 0;
      })
      .forEach(network => {
        const key = network.display_name?.toLowerCase() || network.feed_id.toLowerCase();
        
        if (!networkMap.has(key)) {
          networkMap.set(key, {
            ...network,
            operators: []
          });
        }

        const existingNetwork = networkMap.get(key)!;
        
        // Grouper les opérateurs actifs par display_name
        const operatorGroups = new Map<string, Operator[]>();
        network.operators?.forEach(op => {
          if (op.is_active) {
            const key = op.display_name || op.name;
            if (!operatorGroups.has(key)) {
              operatorGroups.set(key, []);
            }
            operatorGroups.get(key)!.push(op);
          }
        });

        // Ne garder qu'un seul opérateur par groupe
        operatorGroups.forEach((operators, displayName) => {
          if (!existingNetwork.operators?.some(existing => (existing.display_name || existing.name) === displayName)) {
            // Utiliser le premier opérateur du groupe comme représentant
            const representative = operators[0];
            existingNetwork.operators = [...(existingNetwork.operators || []), representative];
          }
        });
      });

    // Convertir la Map en tableau et trier
    const allNetworks = Array.from(networkMap.values());

    // Fonction pour déterminer si un réseau est régional
    const isRegionalNetwork = (network: Network) => {
      const name = (network.display_name || network.feed_id).toLowerCase();
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
      .sort((a, b) => (a.display_name || a.feed_id).localeCompare(b.display_name || b.feed_id));

    const urban = allNetworks
      .filter(n => !isRegionalNetwork(n))
      .sort((a, b) => (a.display_name || a.feed_id).localeCompare(b.display_name || b.feed_id));

    return {
      regionalNetworks: regional,
      urbanNetworks: urban
    };
  }, [networks]);

  const handleNetworkClick = (network: Network) => {
    onSelectNetwork(network);
    
    // Trouver le premier opérateur actif
    const firstOperator = network.operators?.find(op => op.is_active);
    if (firstOperator) {
      // Sélectionner automatiquement le premier opérateur
      onSelectNetwork({
        ...network,
        operators: [firstOperator]
      });
    }
  };

  const renderNetworkButton = (network: Network) => {
    // Compter les opérateurs uniques par display_name
    const uniqueOperators = new Set(
      network.operators
        ?.filter(op => op.is_active)
        .map(op => op.display_name || op.name)
    );
    
    return (
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
            <div className="font-medium truncate">{network.display_name || network.feed_id}</div>
          </div>
          {uniqueOperators.size > 0 && (
            <div className="flex items-center">
              <div className={`
                text-xs px-2 py-1 rounded-full
                ${selectedNetwork?.id === network.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {uniqueOperators.size} op.
              </div>
            </div>
          )}
        </div>
      </button>
    );
  };

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