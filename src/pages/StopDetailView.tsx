import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { networkService } from '../services/networkService';
import { ArrowLeft, Bus, Train, Ship, Cable, Drama as Tram, Clock, Armchair as Wheelchair } from 'lucide-react';
import { Route, Stop, Stoptime } from '../types/api';
import LineNameDisplay from '../components/LineNameDisplay';

const StopDetailView: React.FC = () => {
  const { stopId } = useParams<{ stopId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const regionId = searchParams.get('region');

  const { data: stop, isLoading, error } = useQuery(
    ['stop', stopId, regionId],
    () => {
      if (!stopId || !regionId) return null;
      return networkService.getStopDetails(stopId, regionId);
    },
    {
      enabled: !!stopId && !!regionId,
      refetchInterval: 30000
    }
  );

  const groupedDepartures = React.useMemo(() => {
    if (!stop?.stoptimesWithoutPatterns) return new Map();

    const groups = new Map<string, Stoptime[]>();
    stop.stoptimesWithoutPatterns.forEach(departure => {
      const routeId = departure.trip.route.gtfsId;
      if (!groups.has(routeId)) {
        groups.set(routeId, []);
      }
      groups.get(routeId)?.push(departure);
    });

    groups.forEach(departures => {
      departures.sort((a, b) => {
        const timeA = a.realtimeDeparture || a.scheduledDeparture;
        const timeB = b.realtimeDeparture || b.scheduledDeparture;
        return timeA - timeB;
      });
    });

    return groups;
  }, [stop?.stoptimesWithoutPatterns]);

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
            La région doit être spécifiée pour afficher les détails de l'arrêt.
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

  if (error || !stop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-lg font-medium text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">
            Une erreur est survenue lors du chargement des détails de l'arrêt.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  const sortedRoutes = [...(stop.routes || [])].sort((a, b) => {
    if (a.mode !== b.mode) {
      const modeOrder = {
        'SUBWAY': 1,
        'RAIL': 2,
        'TRAM': 3,
        'BUS': 4,
        'COACH': 5,
        'FERRY': 6,
        'CABLE_CAR': 7,
        'GONDOLA': 8,
        'FUNICULAR': 9
      };
      return (modeOrder[a.mode] || 99) - (modeOrder[b.mode] || 99);
    }
    
    const aNum = parseInt(a.shortName);
    const bNum = parseInt(b.shortName);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.shortName.localeCompare(b.shortName);
  });

  const nextDepartures = [...(stop.stoptimesWithoutPatterns || [])].sort((a, b) => {
    const timeA = a.realtimeDeparture || a.scheduledDeparture;
    const timeB = b.realtimeDeparture || b.scheduledDeparture;
    return timeA - timeB;
  }).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold text-gray-900">{stop.name}</h1>
                {stop.wheelchairBoarding === 'POSSIBLE' && (
                  <div 
                    className="p-1 bg-blue-100 rounded-full"
                    title="Arrêt accessible aux personnes à mobilité réduite"
                  >
                    <Wheelchair className="h-5 w-5 text-blue-700" />
                  </div>
                )}
              </div>
              {stop.desc && (
                <p className="mt-1 text-sm text-gray-500">{stop.desc}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        {nextDepartures.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Prochains passages
              </h2>
              <div className="space-y-4">
                {nextDepartures.map((departure, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Link
                        to={`/line/${departure.trip.route.gtfsId}?region=${regionId}`}
                        className="flex items-center hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div 
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full"
                          style={{
                            backgroundColor: `#${departure.trip.route.color || 'e5e7eb'}`,
                            color: `#${departure.trip.route.textColor || '000000'}`
                          }}
                        >
                          {getModeIcon(departure.trip.route.mode)}
                          <span className="font-medium">{departure.trip.route.shortName}</span>
                        </div>
                      </Link>
                      <div className="ml-4">
                        <div className="font-medium">{departure.headsign}</div>
                        <div className="text-sm text-gray-500">
                          Direction : {departure.trip.pattern.headsign}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {departure.realtime ? (
                        <div className="flex items-center text-green-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{new Date(departure.realtimeDeparture * 1000).toLocaleTimeString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {new Date(departure.scheduledDeparture * 1000).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {sortedRoutes.map((route: Route) => {
          const departures = groupedDepartures.get(route.gtfsId) || [];
          if (departures.length === 0) return null;

          const backgroundColor = route.color ? `#${route.color}` : '#f3f4f6';
          const textColor = route.textColor ? `#${route.textColor}` : (route.color ? '#FFFFFF' : '#000000');
          
          const hasRealtimeData = departures.some(d => d.realtime);

          return (
            <div key={route.gtfsId} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <Link 
                  to={`/line/${route.gtfsId}?region=${regionId}`}
                  className="flex items-center space-x-4 mb-4 hover:bg-gray-50 rounded-lg transition-colors p-2"
                >
                  <div 
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor, color: textColor }}
                  >
                    {getModeIcon(route.mode)}
                    <span className="font-medium">{route.shortName}</span>
                  </div>
                  <div className="flex-1">
                    <LineNameDisplay
                      shortName={route.shortName}
                      longName={route.longName}
                      hasRealtimeData={hasRealtimeData}
                    />
                  </div>
                </Link>

                <div className="space-y-4">
                  {departures.slice(0, 3).map((departure, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{departure.headsign}</div>
                        <div className="text-sm text-gray-500">
                          Direction : {departure.trip.pattern.headsign}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {departure.realtime ? (
                          <div className="flex items-center text-green-600">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{new Date(departure.realtimeDeparture * 1000).toLocaleTimeString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            {new Date(departure.scheduledDeparture * 1000).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default StopDetailView;