import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { networkService } from '../../services/networkService';
import { Network, Search, Plus, Upload, Download, Bus, Train, Ship, Drama as Tram, Cable, Loader, Edit, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TransitMode } from '../../types/api';
import { regions } from '../../data/regions';

const NetworkList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const { data: networks = [], isLoading, error } = useQuery(
    ['networks', selectedRegion],
    () => selectedRegion 
      ? networkService.getNetworksByRegion(selectedRegion)
      : networkService.getAllNetworks(),
    {
      // Disable caching to always get fresh data
      cacheTime: 0,
      staleTime: 0
    }
  );

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = await networkService.exportNetworksToCSV();
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reseaux_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Une erreur est survenue lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case TransitMode.RAIL:
      case TransitMode.SUBWAY:
        return <Train size={16} />;
      case TransitMode.BUS:
      case TransitMode.COACH:
        return <Bus size={16} />;
      case TransitMode.TRAM:
        return <Tram size={16} />;
      case TransitMode.FERRY:
        return <Ship size={16} />;
      case TransitMode.CABLE_CAR:
      case TransitMode.GONDOLA:
      case TransitMode.FUNICULAR:
        return <Cable size={16} />;
      default:
        return <Bus size={16} />;
    }
  };

  const filteredNetworks = networks.filter(network =>
    (network.display_name || network.name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Une erreur est survenue lors du chargement des réseaux</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Réseaux de transport</h1>
        <div className="flex space-x-2">
          <Link
            to="/admin/networks/import"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Link>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-spin' : ''}`} />
            {isExporting ? 'Export...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sélecteur de région */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="inline-block h-4 w-4 mr-1" />
            Filtrer par région
          </label>
          <select
            id="region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Toutes les régions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Barre de recherche */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            <Search className="inline-block h-4 w-4 mr-1" />
            Rechercher un réseau
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="search"
              placeholder="Rechercher un réseau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredNetworks.map((network) => (
          <div key={network.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {network.display_name || network.name}
                  </h2>
                  <div className="mt-1 text-sm text-gray-500">
                    {network.operators?.length || 0} opérateur{network.operators?.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    network.is_available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {network.is_available ? (
                      <>
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Disponible
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-1 h-4 w-4" />
                        Indisponible
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {network.operators && network.operators.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="divide-y divide-gray-200">
                  {network.operators.map((operator) => (
                    <div key={operator.id} className="px-6 py-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {operator.name}
                          </div>
                          <div className="text-sm text-gray-500">{operator.gtfs_id}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            operator.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {operator.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredNetworks.length === 0 && (
          <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
            Aucun réseau trouvé
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkList;