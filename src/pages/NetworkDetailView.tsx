import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { networkService } from '../services/networkService';
import { regionService } from '../services/regionService';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const NetworkDetailView: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const regionId = searchParams.get('region');
  const decodedName = decodeURIComponent(name || '').replace(/-/g, ' ');

  const { data: region } = useQuery(
    ['region', regionId],
    () => regionId ? regionService.getRegionById(regionId) : null,
    { enabled: !!regionId }
  );

  const { data: networks, isLoading } = useQuery(
    ['networks', regionId],
    () => regionId ? networkService.getNetworksByRegion(regionId) : Promise.resolve([]),
    { enabled: !!regionId }
  );

  // Trouver le réseau correspondant au nom décodé
  const network = networks?.find(n => {
    const networkName = (n.display_name || n.name).toLowerCase();
    return networkName === decodedName.toLowerCase();
  });

  const metaDescription = `Découvrez les opérateurs de transport du réseau ${decodedName}${region ? ` en ${region.name}` : ''}.`;

  if (!regionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-lg font-medium text-red-600 mb-2">Région non spécifiée</h2>
          <p className="text-gray-600 mb-4">
            La région doit être spécifiée pour afficher les détails du réseau.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!network) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Réseau non trouvé</h2>
          <p className="mt-2 text-gray-500">
            Nous n'avons pas trouvé le réseau demandé.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate(regionId ? `/?region=${regionId}` : '/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Retour à la liste des réseaux
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{`${decodedName}${region ? ` - ${region.name}` : ''} | MaaSify`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${decodedName}${region ? ` - ${region.name}` : ''}`} />
        <meta property="og:description" content={metaDescription} />
        <link rel="canonical" href={`${window.location.origin}/reseau/${name}${regionId ? `?region=${regionId}` : ''}`} />
      </Helmet>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(regionId ? `/?region=${regionId}` : '/')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{decodedName}</h1>
              {region && (
                <p className="mt-1 text-sm text-gray-500">{region.name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {network.operators && network.operators.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Opérateurs du réseau
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {network.operators.map((operator) => (
                <li key={operator.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {operator.name}
                      </h3>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        operator.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {operator.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun opérateur trouvé</h3>
              <p className="mt-2 text-sm text-gray-500">
                Nous n'avons trouvé aucun opérateur de transport pour ce réseau.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate(regionId ? `/?region=${regionId}` : '/')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Retour à la liste des réseaux
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NetworkDetailView;