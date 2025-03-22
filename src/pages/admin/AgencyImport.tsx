import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { networkService } from '../../services/networkService';
import { networkCheckService } from '../../services/networkCheckService';
import { Region } from '../../types/api';
import { regions } from '../../data/regions';
import { Network, RefreshCw, ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const AgencyImport: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<any>(null);

  // Récupérer les réseaux de la région sélectionnée
  const { data: networks, isLoading, refetch } = useQuery(
    ['networks', selectedRegion?.id],
    () => selectedRegion ? networkService.getNetworksByRegion(selectedRegion.id) : null,
    {
      enabled: !!selectedRegion
    }
  );

  const handleCheckAllNetworks = async () => {
    if (!selectedRegion) return;
    
    try {
      setIsChecking(true);
      setCheckResults(null);

      const results = await networkCheckService.checkAllNetworks(selectedRegion.id);
      
      setCheckResults({
        success: results.success,
        message: results.success 
          ? `${results.imported} réseau${results.imported > 1 ? 'x' : ''} importé${results.imported > 1 ? 's' : ''} sur ${results.total}`
          : results.message,
        errors: results.errors
      });

      // Recharger les données
      await refetch();
    } catch (error) {
      setCheckResults({
        success: false,
        message: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Import des réseaux depuis l'API
        </h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
              Sélectionner une région
            </label>
            <select
              id="region"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={selectedRegion?.id || ''}
              onChange={(e) => {
                const region = regions.find(r => r.id === e.target.value);
                setSelectedRegion(region || null);
                setCheckResults(null);
              }}
            >
              <option value="">Choisir une région</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {selectedRegion && (
            <div className="flex justify-end">
              <button
                onClick={handleCheckAllNetworks}
                disabled={isChecking}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Import en cours...' : 'Importer les réseaux'}
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <Network className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          )}

          {networks?.length === 0 && !isLoading && !checkResults && (
            <div className="flex items-center p-4 bg-yellow-50 text-yellow-700 rounded-lg">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>
                Aucun réseau trouvé pour cette région. Cliquez sur "Importer les réseaux" pour récupérer les données depuis l'API.
              </span>
            </div>
          )}

          {checkResults && (
            <div className={`p-4 rounded-lg ${
              checkResults.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center mb-2">
                {checkResults.success ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">
                  {checkResults.message}
                </span>
              </div>
              {checkResults.errors && checkResults.errors.length > 0 && (
                <div className="mt-2 text-red-700">
                  <p className="font-medium">Erreurs :</p>
                  <ul className="list-disc list-inside">
                    {checkResults.errors.map((error: string, index: number) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {networks && networks.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Réseaux importés ({networks.length})
              </h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Nom
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        ID GTFS
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Feed ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {networks.map((network) => (
                      <tr key={network.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {network.display_name || network.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {network.gtfs_id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {network.feed_id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
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
                                <XCircle className="mr-1 h-4 w-4" />
                                Indisponible
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyImport;