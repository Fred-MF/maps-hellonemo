import React, { useState, Suspense, lazy, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { networkService } from '../services/networkService';
import { Bus, Train, Ship, Cable, Drama as Tram, ArrowLeft } from 'lucide-react';
import LineTimeline from '../components/LineTimeline';
import LineDetailTabs from '../components/LineDetailTabs';
import LineNameDisplay from '../components/LineNameDisplay';

// Chargement paresseux des composants lourds
const LineInfo = lazy(() => import('../components/LineInfo'));
const LineMap = lazy(() => import('../components/LineMap'));

// Clé pour le stockage de l'onglet actif
const ACTIVE_TAB_STORAGE_KEY = 'lineDetailActiveTab';

const LineDetailView: React.FC = () => {
  const { lineId } = useParams<{ lineId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const regionId = searchParams.get('region');
  const networkId = searchParams.get('network');
  const operatorId = searchParams.get('operator');
  const headerRef = useRef<HTMLElement>(null);

  const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'info'>(() => {
    const savedTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return (savedTab as 'timeline' | 'map' | 'info') || 'timeline';
  });
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const { top } = headerRef.current.getBoundingClientRect();
        setIsHeaderSticky(top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: line, isLoading, error } = useQuery(
    ['line', lineId, regionId],
    () => {
      if (!lineId || !regionId) return null;
      return networkService.getOperatorRouteDetails(lineId, regionId);
    },
    {
      enabled: !!lineId && !!regionId
    }
  );

  const handleBack = () => {
    if (regionId && networkId && operatorId) {
      const cachedNetworks = queryClient.getQueryData(['networks', regionId]);
      const cachedRoutes = queryClient.getQueryData(['routes', operatorId, regionId]);
      
      if (cachedNetworks && cachedRoutes) {
        navigate(-1);
      } else {
        navigate(`/?region=${regionId}&network=${networkId}&operator=${operatorId}`);
      }
    } else {
      navigate('/');
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'RAIL':
      case 'SUBWAY':
        return <Train size={16} />;
      case 'BUS':
      case 'COACH':
        return <Bus size={16} />;
      case 'TRAM':
        return <Tram size={16} />;
      case 'FERRY':
        return <Ship size={16} />;
      case 'CABLE_CAR':
      case 'GONDOLA':
      case 'FUNICULAR':
        return <Cable size={16} />;
      default:
        return <Bus size={16} />;
    }
  };

  if (!regionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-lg font-medium text-red-600 mb-2">Région non spécifiée</h2>
          <p className="text-gray-600 mb-4">
            La région doit être spécifiée pour afficher les détails de la ligne.
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !line) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-lg font-medium text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">
            Une erreur est survenue lors du chargement des détails de la ligne.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à la liste des lignes
          </button>
        </div>
      </div>
    );
  }

  const backgroundColor = line.color ? `#${line.color}` : '#f3f4f6';
  const textColor = line.textColor ? `#${line.textColor}` : (line.color ? '#FFFFFF' : '#000000');

  const hasRealtimeData = line.patterns?.some(pattern =>
    pattern.stops?.some(stop =>
      stop.realtimeDeparture || stop.realtimeArrival
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header 
        ref={headerRef}
        className={`transition-all duration-200 ${
          isHeaderSticky 
            ? 'fixed top-0 left-0 right-0 z-50 shadow-md' 
            : ''
        }`}
        style={{ backgroundColor, color: textColor }}
      >
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBack}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: textColor }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10">
                {getModeIcon(line.mode)}
                <span className="font-medium text-sm">{line.shortName}</span>
              </div>
              <div className="text-sm hidden sm:block">
                <LineNameDisplay
                  shortName={line.shortName}
                  longName={line.longName}
                  hasRealtimeData={hasRealtimeData}
                />
              </div>
            </div>
            <div className="w-8" />
          </div>
        </div>
      </header>

      {isHeaderSticky && <div className="h-16" />}

      <main className="sm:px-4">
        <div className="bg-white shadow sm:rounded-lg">
          <div className={`sticky top-16 bg-white z-40 ${isHeaderSticky ? 'shadow-sm' : ''}`}>
            <LineDetailTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              line={line}
            />
          </div>

          <div className={`${activeTab === 'map' ? 'relative' : 'p-4 sm:p-6'}`}>
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }>
              {activeTab === 'timeline' && line.patterns?.[0] && (
                <LineTimeline 
                  pattern={line.patterns[0]} 
                  color={backgroundColor}
                  regionId={regionId}
                />
              )}
              {activeTab === 'map' && (
                <LineMap 
                  line={line} 
                  apiKey="yBXDgvRsu1MaB6pUqbrO"
                />
              )}
              {activeTab === 'info' && (
                <LineInfo line={line} />
              )}
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LineDetailView;