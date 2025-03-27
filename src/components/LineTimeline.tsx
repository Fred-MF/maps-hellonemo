import React from 'react';
import { Pattern, Stop } from '../types/api';
import { Clock, Map, Star, ArrowLeft, ArrowRight, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface LineTimelineProps {
  pattern: Pattern;
  color?: string;
  regionId: string;
}

interface Connection {
  id: string;
  name: string;
  type: 'bus' | 'metro' | 'tram' | 'train';
  color?: string;
}

const LineTimeline: React.FC<LineTimelineProps> = ({ pattern, color = '#1d4ed8', regionId }) => {
  const now = new Date();

  // Fonction pour formater l'heure au format HH:mm
  const formatTime = (time: string) => {
    return format(new Date(time), 'HH:mm');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* En-tête */}
      <div className="bg-blue-500 text-white p-4">
        <div className="flex items-center mb-4">
          <Link to={-1} className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Direction {pattern.headsign}</h1>
            <div className="text-lg">{pattern.name}</div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-lg p-2">
          <button className="flex flex-col items-center p-3 text-center">
            <Map className="h-6 w-6 mb-1" />
            <span>Sur la carte</span>
          </button>
          <button className="flex flex-col items-center p-3 text-center">
            <Star className="h-6 w-6 mb-1" />
            <span>Favoris</span>
          </button>
          <button className="flex flex-col items-center p-3 text-center">
            <Clock className="h-6 w-6 mb-1" />
            <span>{format(now, 'dd/MM', { locale: fr })}</span>
            <span>{format(now, 'H')}h/{format(now, 'H')}h</span>
          </button>
        </div>
      </div>

      {/* Liste des arrêts */}
      <div className="flex-1 overflow-auto p-4">
        <div className="relative">
          {/* Ligne verticale */}
          <div 
            className="absolute left-1/2 top-8 bottom-8 w-1 rounded"
            style={{ backgroundColor: color }}
          />

          {/* Arrêts */}
          {pattern.stops.map((stop, index) => (
            <div key={stop.gtfsId} className="relative flex items-start mb-8">
              {/* Nom et correspondances */}
              <div className="flex-1 text-right pr-4">
                <Link 
                  to={`/stop/${stop.gtfsId}?region=${regionId}`}
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {stop.name}
                  {stop.wheelchair && <span className="ml-2">♿</span>}
                </Link>
                {stop.connections && (
                  <div className="flex flex-wrap justify-end gap-1 mt-1">
                    {stop.connections.map(connection => (
                      <span
                        key={connection.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: connection.color || '#e5e7eb',
                          color: connection.color ? '#fff' : '#374151'
                        }}
                      >
                        {connection.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Point sur la ligne */}
              <div className="relative z-10">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: color }}
                />
              </div>

              {/* Horaire */}
              <div className="flex-1 pl-4">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {stop.scheduledDeparture 
                      ? formatTime(stop.scheduledDeparture)
                      : '--:--'
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t p-4">
        <div className="flex justify-between items-center">
          <button className="flex items-center text-orange-500">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Plus tôt
          </button>
          <button className="flex items-center text-orange-500">
            <ArrowUpDown className="h-5 w-5 mr-1" />
            Changer de direction
          </button>
          <button className="flex items-center text-orange-500">
            Plus tard
            <ArrowRight className="h-5 w-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LineTimeline;