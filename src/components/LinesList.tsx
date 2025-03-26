import React from 'react';
import { Route } from '../types/api';
import { Bus, Train, Ship, Cable, Drama as Tram, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LinesListProps {
  lines: Route[];
  isLoading: boolean;
  error: Error | null;
  regionId: string;
  networkId: string;
  operatorId: string;
}

const LinesList: React.FC<LinesListProps> = ({ 
  lines, 
  isLoading, 
  error, 
  regionId,
  networkId,
  operatorId
}) => {
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

  // Trier les lignes par type puis par nom court
  const sortedLines = [...lines].sort((a, b) => {
    // D'abord trier par route_type
    if (a.type !== b.type) {
      return a.type - b.type;
    }
    
    // Ensuite trier par shortName en tenant compte du format numérique
    const aNum = parseInt(a.shortName);
    const bNum = parseInt(b.shortName);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    
    return a.shortName.localeCompare(b.shortName);
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Une erreur est survenue lors du chargement des lignes
      </div>
    );
  }

  if (!sortedLines.length) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Aucune ligne disponible
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Nous n'avons trouvé aucune ligne de transport pour cet opérateur.
            <br />
            Cela peut être dû à une mise à jour des données en cours ou à une indisponibilité temporaire du service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {sortedLines.map((line) => {
        const backgroundColor = line.color ? `#${line.color}` : '#f3f4f6';
        const textColor = line.textColor ? `#${line.textColor}` : (line.color ? '#FFFFFF' : '#000000');
        const [origin, destination] = line.longName.split(' - ');

        return (
          <Link 
            key={line.gtfsId} 
            to={`/line/${line.gtfsId}?region=${regionId}&network=${networkId}&operator=${operatorId}`}
            className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="flex items-center p-2">
              <div 
                className="flex items-center space-x-1.5 px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor,
                  color: textColor
                }}
              >
                {getModeIcon(line.mode)}
                <span className="font-medium text-sm">{line.shortName}</span>
              </div>
              <div className="flex-1 px-3 py-1 min-w-0">
                <div className="flex items-center text-sm text-gray-600 space-x-2">
                  <span className="truncate">{origin}</span>
                  <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{destination}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default LinesList;