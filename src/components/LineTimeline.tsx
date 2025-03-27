import React from 'react';
import { Pattern, Stop } from '../types/api';
import { Clock, AlertCircle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

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

  // Fonction pour calculer le retard
  const getDelay = (scheduled: string, realtime?: string) => {
    if (!realtime) return null;
    const delay = differenceInMinutes(new Date(realtime), new Date(scheduled));
    return delay;
  };

  // Fonction pour générer les badges de connexion
  const renderConnectionBadges = (connections: Connection[]) => {
    return connections.map(connection => (
      <span
        key={connection.id}
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-1"
        style={{
          backgroundColor: connection.color || '#e5e7eb',
          color: connection.color ? '#fff' : '#374151'
        }}
      >
        {connection.name}
      </span>
    ));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
        {/* Colonne de gauche - Arrêts desservis */}
        <div className="text-right space-y-12">
          {pattern.stops.map((stop, index) => (
            <div key={stop.gtfsId} className="relative pt-2">
              <Link 
                to={`/stop/${stop.gtfsId}?region=${regionId}`}
                className="hover:text-blue-600"
              >
                <div className="font-medium text-gray-900">{stop.name}</div>
                {stop.desc && (
                  <div className="text-sm text-gray-500">{stop.desc}</div>
                )}
              </Link>
              {/* Badges de connexion */}
              {stop.connections && (
                <div className="mt-1 flex flex-wrap justify-end gap-1">
                  {renderConnectionBadges(stop.connections)}
                </div>
              )}
              {/* Badge d'accessibilité */}
              {stop.wheelchair && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  ♿
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Colonne centrale - Ligne verticale et points */}
        <div className="flex flex-col items-center relative">
          <div 
            className="absolute top-6 bottom-6 w-1 rounded"
            style={{ backgroundColor: color }}
          />
          {pattern.stops.map((stop, index) => (
            <div key={stop.gtfsId} className="relative my-12 first:mt-2 last:mb-2">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
              />
            </div>
          ))}
        </div>

        {/* Colonne de droite - Horaires */}
        <div className="space-y-12">
          {pattern.stops.map((stop, index) => {
            const delay = stop.scheduledDeparture && stop.realtimeDeparture
              ? getDelay(stop.scheduledDeparture, stop.realtimeDeparture)
              : null;

            return (
              <div key={stop.gtfsId} className="relative pt-2">
                {stop.scheduledDeparture && (
                  <div className="space-y-1">
                    <div className="inline-flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatTime(stop.scheduledDeparture)}</span>
                    </div>

                    {delay !== null && (
                      <div className={`
                        inline-flex items-center text-sm rounded px-2 py-0.5
                        ${delay > 0
                          ? 'bg-red-100 text-red-800'
                          : delay < 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      `}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {delay > 0
                          ? `+${delay} min`
                          : delay < 0
                            ? `${delay} min`
                            : 'À l\'heure'
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LineTimeline;