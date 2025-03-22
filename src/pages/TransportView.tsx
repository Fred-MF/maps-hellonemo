import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { regionService } from '../services/regionService';
import { networkService } from '../services/networkService';
import { Region, Network, Operator, Route } from '../types/api';
import RegionFilter from '../components/RegionFilter';
import NetworkFilter from '../components/NetworkFilter';
import OperatorFilter from '../components/OperatorFilter';
import LinesList from '../components/LinesList';
import Breadcrumb from '../components/Breadcrumb';

const TransportView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
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

  // Charger les routes de l'opérateur sélectionné
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery(
    ['routes', selectedOperator?.id, selectedRegion?.id],
    () => selectedOperator && selectedRegion 
      ? networkService.getOperatorRoutes(selectedOperator.gtfs_id, selectedRegion.id)
      : Promise.resolve([]),
    { enabled: !!selectedOperator && !!selectedRegion }
  );

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
                if (operator) {
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

  // Filtrer les opérateurs du réseau sélectionné
  const operators = React.useMemo(() => {
    if (!selectedNetwork) return [];
    return selectedNetwork.operators || [];
  }, [selectedNetwork]);

  // Sélectionner automatiquement l'opérateur s'il n'y en a qu'un seul
  useEffect(() => {
    if (operators.length === 1 && !selectedOperator) {
      setSelectedOperator(operators[0]);
      setSearchParams({ 
        region: selectedRegion!.id, 
        network: selectedNetwork!.id,
        operator: operators[0].id
      });
    }
  }, [operators, selectedOperator, selectedRegion, selectedNetwork, setSearchParams]);

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
    setSelectedOperator(operator);
    setSearchParams({ 
      region: selectedRegion!.id, 
      network: selectedNetwork!.id,
      operator: operator.id
    });
  };

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
        // N'afficher le sélecteur d'opérateur que s'il y a plus d'un opérateur
        return operators.length > 1 ? (
          <OperatorFilter
            operators={operators}
            selectedOperator={selectedOperator}
            onSelectOperator={handleOperatorSelect}
          />
        ) : null;
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
        {selectedOperator && selectedRegion && selectedNetwork && (
          <div className={`${renderActiveView() ? 'mt-6' : ''}`}>
            <h2 className="text-lg font-semibold mb-4">
              {operators.length === 1 ? (
                'Lignes disponibles'
              ) : (
                `Lignes de ${selectedOperator.name}`
              )}
            </h2>
            <LinesList
              lines={routes}
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