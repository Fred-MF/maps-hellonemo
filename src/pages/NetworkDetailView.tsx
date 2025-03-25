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
    () => regionId ? networkService.getNetworksByRegion(regionId) : Promise.resolve([])
  );

  // Trouver le réseau correspondant au nom décodé
  const network = networks?.find(n => {
    const networkName = (n.display_name || n.feed_id).toLowerCase();
    return networkName === decodedName.toLowerCase();
  });

  // Filtrer les opérateurs actifs et les grouper par display_name
  const operatorGroups = React.useMemo(() => {
    if (!network?.operators) return new Map();
    
    const groups = new Map<string, typeof network.operators>();
    network.operators
      .filter(op => op.is_active)
      .forEach(op => {
        const key = op.display_name || op.name;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(op);
      });
    
    return groups;
  }, [network]);

  // Si un seul groupe d'opérateurs, rediriger directement vers la liste des lignes
  React.useEffect(() => {
    if (operatorGroups.size === 1) {
      const [firstGroup] = operatorGroups.values();
      if (firstGroup && firstGroup.length > 0 && network) {
        navigate(`/?region=${regionId}&network=${network.id}&operator=${firstGroup[0].id}`);
      }
    }
  }, [operatorGroups, network, regionId, navigate]);

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

  if (!network || !network.is_available || operatorGroups.size === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Réseau non disponible</h2>
          <p className="mt-2 text-gray-500">
            Ce réseau n'est pas disponible actuellement.
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
        <title>{`${network.display_name || network.feed_id}${region ? ` - ${region.name}` : ''} | MaaSify`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${network.display_name || network.feed_id}${region ? ` - ${region.name}` : ''}`} />
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
              <h1 className="text-3xl font-bold text-gray-900">{network.display_name || network.feed_id}</h1>
              {region && (
                <p className="mt-1 text-sm text-gray-500">{region.name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {operatorGroups.size > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Opérateurs du réseau
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {Array.from(operatorGroups.entries()).map(([displayName, operators]) => (
                <li key={displayName} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {displayName}
                      </h3>
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/?region=${regionId}&network=${network.id}&operator=${operators[0].id}`)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Voir les lignes
                      </button>
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun opérateur actif</h3>
              <p className="mt-2 text-sm text-gray-500">
                Nous n'avons trouvé aucun opérateur actif pour ce réseau.
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