import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { networkService } from '../services/networkService';
import { Bus, Train, Ship, Cable, Drama as Tram, ArrowLeft, Star, Map, Clock } from 'lucide-react';
import LineMap from '../components/LineMap';
import LineNameDisplay from '../components/LineNameDisplay';
import { format, startOfHour } from 'date-fns';
import { fr } from 'date-fns/locale';

const LineMapView: React.FC = () => {
  const { lineId } = useParams<{ lineId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const regionId = searchParams.get('region');

  // État pour les favoris
  const [isFavorite, setIsFavorite] = useState(false);

  // État pour la date et l'heure sélectionnées
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(startOfHour(new Date()));

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
    navigate(-1);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implémenter la logique de sauvegarde des favoris
  };

  const handleTimeSlotClick = () => {
    // TODO: Implémenter le sélecteur de date et de tranche horaire
  };

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const hour = now.getHours();
    const slotStart = Math.floor(hour / 2) * 2;
    const slotEnd = slotStart + 2;
    return `${slotStart}h/${slotEnd}h`;
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
            La région doit être spécifiée pour afficher la carte.
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
            Une erreur est survenue lors du chargement de la carte.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  const backgroundColor = line.color ? `#${line.color}` : '#f3f4f6';
  const textColor = line.textColor ? `#${line.textColor}` : (line.color ? '#FFFFFF' : '#000000');

  return (
    <div className="min-h-screen bg-gray-50">
      <header 
        className="sticky top-0 z-50 shadow-md"
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
                  hasRealtimeData={line.patterns?.some(pattern =>
                    pattern.stops?.some(stop =>
                      stop.realtimeDeparture || stop.realtimeArrival
                    )
                  )}
                />
              </div>
            </div>
            <div className="w-8" />
          </div>
        </div>
      </header>

      <div style={{ backgroundColor, color: textColor }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={handleBack}
              className="flex flex-col items-center p-3 text-current hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Voir les horaires"
              type="button"
            >
              <Clock className="h-6 w-6 mb-1" />
              <span className="text-sm">Horaires</span>
            </button>
            <button
              onClick={toggleFavorite}
              className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-yellow-300 hover:bg-white/10' 
                  : 'text-current hover:bg-white/10'
              }`}
            >
              <Star className="h-6 w-6 mb-1" />
              <span className="text-sm">Favoris</span>
            </button>
            <button
              onClick={handleTimeSlotClick}
              className="flex flex-col items-center p-3 text-current hover:bg-white/10 rounded-lg transition-colors"
            >
              <Clock className="h-6 w-6 mb-1" />
              <div className="text-sm text-center">
                <div>{format(selectedDate, 'dd/MM', { locale: fr })}</div>
                <div>{getCurrentTimeSlot()}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <main className="relative flex-1" style={{ height: 'calc(100vh - 144px)' }}>
        <LineMap 
          line={line} 
          apiKey="yBXDgvRsu1MaB6pUqbrO"
        />
      </main>
    </div>
  );
};

export default LineMapView;