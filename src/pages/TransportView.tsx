import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { regionService } from '../services/regionService';
import { networkService } from '../services/networkService';
import { Region, Network, Operator, Route, TransitMode } from '../types/api';
import RegionFilter from '../components/RegionFilter';
import NetworkFilter from '../components/NetworkFilter';
import OperatorFilter from '../components/OperatorFilter';
import LinesList from '../components/LinesList';
import Breadcrumb from '../components/Breadcrumb';
import TransportModeFilter from '../components/TransportModeFilter';

const TransportView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [selectedModes, setSelectedModes] = useState<TransitMode[]>([]);
  const [activeView, setActiveView] = useState<'region' | 'network' | 'operator'>('region');

  // Récupérer les paramètres de l'URL
  const regionId = searchParams.get('region');
  const networkId = searchParams.get('network');
  const operatorId = searchParams.get('operator');

  // Charger les régions
  const { data: regions = [] } = useQuery('regions', regionService.getAllRegions);

  // Charger les réseaux de la région sélectionnée
  const { data: networks = [], isLoading: isLoadingNetworks } = useQuery(
    ['networks', selectedRegion?.id],
    () => selectedRegion ? networkService.getNetworksByRegion(selectedRegion.id) : Promise.resolve([]),
    { 
      enabled: !!selectedRegion,
      staleTime: 30000 // Cache les résultats pendant 30 secondes
    }
  );

  // Charger les routes pour tous les opérateurs du même groupe
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery(
    ['routes', selectedOperator?.id, selectedRegion?.id],
    async () => {
      if (!selectedOperator || !selectedRegion || !selectedNetwork) {
        return [];
      }

      // Trouver tous les opérateurs actifs du même groupe (même display_name)
      const groupOperators = selectedNetwork.operators?.filter(op => 
        op.is_active && 
        (op.display_name || op.name) === (selectedOperator.display_name || selectedOperator.name)
      ) || [];

      // Récupérer les routes pour chaque opérateur du groupe
      const allRoutes = await Promise.all(
        groupOperators.map(op => 
          networkService.getOperatorRoutes(op.gtfs_id, selectedRegion.id)
        )
      );

      // Fusionner et dédupliquer les routes
      const uniqueRoutes = new Map<string, Route>();
      allRoutes.flat().forEach(route => {
        uniqueRoutes.set(route.gtfsId, route);
      });

      return Array.from(uniqueRoutes.values());
    },
    { enabled: !!selectedOperator && !!selectedRegion }
  );

  // Réinitialiser les modes sélectionnés quand l'opérateur change
  useEffect(() => {
    setSelectedModes([]);
  }, [selectedOperator]);

  // Restaurer l'état depuis l'URL au chargement
  useEffect(() => {
    const restoreState = async () => {
      if (regionId) {
        const region = regions.find(r => r.id === regionId);
        if (region) {
          setSelectedRegion(region);
          setActiveView('network');

          if (networkId && networks.length > 0) {
            const network = networks.find(n => n.id === networkId);
            if (network) {
              setSelectedNetwork(network);
              setActiveView('operator');

              if (operatorId && network.operators) {
                const operator = network.operators.find(o => o.id === operatorId);
                if (operator && operator.is_active) {
                  setSelectedOperator(operator);
                }
              }
            }
          }
        }
      }
    };

    restoreState();
  }, [regionId, networkId, operatorId, regions, networks]);

  // Grouper les opérateurs actifs par display_name
  const operatorGroups = React.useMemo(() => {
    if (!selectedNetwork?.operators) return [];

    const groups = new Map<string, Operator[]>();
    selectedNetwork.operators
      .filter(op => op.is_active)
      .forEach(op => {
        const key = op.display_name || op.name;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(op);
      });

    return Array.from(groups.values());
  }, [selectedNetwork]);

  // Sélectionner automatiquement le premier groupe d'opérateurs
  useEffect(() => {
    if (operatorGroups.length > 0 && !selectedOperator) {
      const firstGroup = operatorGroups[0];
      if (firstGroup.length > 0) {
        setSelectedOperator(firstGroup[0]);
        setSearchParams({ 
          region: selectedRegion!.id, 
          network: selectedNetwork!.id,
          operator: firstGroup[0].id
        });
      }
    }
  }, [operatorGroups, selectedOperator, selectedRegion, selectedNetwork, setSearchParams]);

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setSelectedNetwork(null);
    setSelectedOperator(null);
    setActiveView('network');
    setSearchParams({ region: region.id });
  };

  const handleNetworkSelect = (network: Network) => {
    setSelectedNetwork(network);
    setSelectedOperator(null);
    setActiveView('operator');
    setSearchParams({ region: selectedRegion!.id, network: network.id });
  };

  const handleOperatorSelect = (operator: Operator) => {
    if (operator.is_active) {
      setSelectedOperator(operator);
      setSearchParams({ 
        region: selectedRegion!.id, 
        network: selectedNetwork!.id,
        operator: operator.id
      });
    }
  };

  // Filtrer les routes par mode de transport
  const filteredRoutes = React.useMemo(() => {
    if (selectedModes.length === 0) return routes;
    return routes.filter(route => selectedModes.includes(route.mode as TransitMode));
  }, [routes, selectedModes]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'region':
        return (
          <RegionFilter
            regions={regions}
            selectedRegion={selectedRegion}
            onSelectRegion={handleRegionSelect}
          />
        );
      case 'network':
        return (
          <NetworkFilter
            networks={networks}
            selectedNetwork={selectedNetwork}
            onSelectNetwork={handleNetworkSelect}
          />
        );
      case 'operator':
        // N'afficher le sélecteur d'opérateur que s'il y a plus d'un groupe d'opérateurs
        return operatorGroups.length > 1 ? (
          <OperatorFilter
            operators={operatorGroups.map(group => group[0])} // Utiliser le premier opérateur de chaque groupe
            selectedOperator={selectedOperator}
            onSelectOperator={handleOperatorSelect}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Réseaux de transport
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Breadcrumb
          region={selectedRegion}
          network={selectedNetwork}
          operator={selectedOperator}
          onSelectRegion={() => setActiveView('region')}
          onSelectNetwork={() => setActiveView('network')}
          onSelectOperator={() => setActiveView('operator')}
        />

        {renderActiveView() && (
          <div className="bg-white shadow rounded-lg p-6">
            {renderActiveView()}
          </div>
        )}

        {/* Liste des lignes */}
        {selectedOperator && selectedOperator.is_active && selectedRegion && selectedNetwork && (
          <div className={`${renderActiveView() ? 'mt-6' : ''}`}>
            <h2 className="text-lg font-semibold mb-4">
              {operatorGroups.length === 1 ? (
                'Lignes disponibles'
              ) : (
                `Lignes de ${selectedOperator.display_name || selectedOperator.name}`
              )}
            </h2>

            {/* Filtre par mode de transport */}
            <TransportModeFilter
              selectedModes={selectedModes}
              onModeChange={setSelectedModes}
              routes={routes}
            />

            <LinesList
              lines={filteredRoutes}
              isLoading={isLoadingNetworks || isLoadingRoutes}
              error={null}
              regionId={selectedRegion.id}
              networkId={selectedNetwork.id}
              operatorId={selectedOperator.id}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default TransportView;