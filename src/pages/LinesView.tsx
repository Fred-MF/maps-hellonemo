import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Helmet } from 'react-helmet-async';
import { networkService } from '../services/networkService';
import { regionService } from '../services/regionService';
import { TransitMode, Network, Operator } from '../types/api';
import { ArrowLeft, Building2, Bus, Train, Ship, Cable, Drama as Tram, Search } from 'lucide-react';

const LinesView: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const regionId = searchParams.get('region');
  const decodedName = decodeURIComponent(name || '').replace(/-/g, ' ');

  const [selectedModes, setSelectedModes] = useState<TransitMode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
  const network = useMemo(() => {
    return networks?.find(n => (n.display_name || n.name) === decodedName);
  }, [networks, decodedName]);

  // Agréger tous les modes de transport du réseau
  const allModes = useMemo(() => {
    if (!network?.network_transport_modes) return [];
    return network.network_transport_modes.map(mode => ({
      mode: mode.mode as TransitMode,
      count: mode.route_count,
      networkName: network.name,
      networkId: network.id
    }));
  }, [network]);

  // Récupérer les modes disponibles uniques
  const availableModes = useMemo(() => {
    const modes = new Set<TransitMode>();
    allModes.forEach(mode => modes.add(mode.mode));
    return Array.from(modes);
  }, [allModes]);

  // Filtrer les modes selon les sélections
  const filteredModes = useMemo(() => {
    return allModes.filter(mode => {
      const matchesMode = selectedModes.length === 0 || selectedModes.includes(mode.mode);
      const matchesSearch = mode.networkName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesMode && matchesSearch;
    });
  }, [allModes, selectedModes, searchTerm]);

  const getModeInfo = (mode: TransitMode): { icon: JSX.Element; label: string; color: string; bgColor: string; hoverColor: string } => {
    switch (mode) {
      case TransitMode.RAIL:
        return { 
          icon: <Train className="h-5 w-5" />, 
          label: 'Train',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          hoverColor: 'hover:bg-blue-100'
        };
      case TransitMode.SUBWAY:
        return { 
          icon: <Train className="h-5 w-5" />, 
          label: 'Métro',
          color: 'text-purple-700',
          bgColor: 'bg-purple-50',
          hoverColor: 'hover:bg-purple-100'
        };
      case TransitMode.BUS:
        return { 
          icon: <Bus className="h-5 w-5" />, 
          label: 'Bus',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          hoverColor: 'hover:bg-green-100'
        };
      case TransitMode.TRAM:
        return { 
          icon: <Tram className="h-5 w-5" />, 
          label: 'Tramway',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          hoverColor: 'hover:bg-red-100'
        };
      case TransitMode.FERRY:
        return { 
          icon: <Ship className="h-5 w-5" />, 
          label: 'Ferry',
          color: 'text-cyan-700',
          bgColor: 'bg-cyan-50',
          hoverColor: 'hover:bg-cyan-100'
        };
      case TransitMode.CABLE_CAR:
        return { 
          icon: <Cable className="h-5 w-5" />, 
          label: 'Téléphérique',
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          hoverColor: 'hover:bg-orange-100'
        };
      case TransitMode.GONDOLA:
        return { 
          icon: <Cable className="h-5 w-5" />, 
          label: 'Télécabine',
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          hoverColor: 'hover:bg-orange-100'
        };
      case TransitMode.FUNICULAR:
        return { 
          icon: <Cable className="h-5 w-5" />, 
          label: 'Funiculaire',
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          hoverColor: 'hover:bg-orange-100'
        };
      default:
        return { 
          icon: <Bus className="h-5 w-5" />, 
          label: 'Transport',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          hoverColor: 'hover:bg-gray-100'
        };
    }
  };

  const totalLines = filteredModes.reduce((sum, mode) => sum + mode.count, 0);

  const metaDescription = `Consultez les ${totalLines} lignes de transport du réseau ${decodedName}${
    region ? ` en ${region.name}` : ''
  }. ${selectedModes.length > 0 ? `Filtré par ${selectedModes.map(mode => getModeInfo(mode).label).join(', ')}.` : ''}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{`Lignes de transport - ${decodedName}${region ? ` - ${region.name}` : ''} | MaaSify`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`Lignes de transport - ${decodedName}${region ? ` - ${region.name}` : ''}`} />
        <meta property="og:description" content={metaDescription} />
        <link rel="canonical" href={`${window.location.origin}/reseau/${name}/lignes${regionId ? `?region=${regionId}` : ''}`} />
      </Helmet>

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/reseau/${name}${regionId ? `?region=${regionId}` : ''}`)}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Lignes de transport - {decodedName}
              </h1>
              {region && (
                <p className="mt-1 text-sm text-gray-500">{region.name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des lignes...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {availableModes.map(mode => {
                    const { icon, label, color, bgColor, hoverColor } = getModeInfo(mode);
                    const isSelected = selectedModes.includes(mode);
                    return (
                      <button
                        key={mode}
                        onClick={() => setSelectedModes(prev =>
                          isSelected
                            ? prev.filter(m => m !== mode)
                            : [...prev, mode]
                        )}
                        className={`
                          inline-flex items-center px-3 py-2 rounded-full
                          transition-all duration-200 ease-in-out
                          ${isSelected ? `ring-2 ring-offset-2 ring-${color.split('-')[1]}-500` : ''}
                          ${bgColor} ${color} ${hoverColor}
                        `}
                        title={`Filtrer par ${label}`}
                      >
                        <span className="sr-only">Filtrer par</span>
                        {icon}
                        <span className="ml-2 text-sm font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Rechercher un opérateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {totalLines} ligne{totalLines > 1 ? 's' : ''} de transport
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {filteredModes.map((mode, index) => {
                  const { icon, label, color, bgColor } = getModeInfo(mode.mode);
                  return (
                    <li key={`${mode.networkId}-${mode.mode}-${index}`} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${bgColor} ${color}`} title={label}>
                            {icon}
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-medium text-gray-900">
                              {mode.count} ligne{mode.count > 1 ? 's' : ''} {label.toLowerCase()}
                            </h4>
                            <p className="text-sm text-gray-500">{mode.networkName}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LinesView;