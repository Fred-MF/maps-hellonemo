import React, { useMemo } from 'react';
import { Bus, Train, Ship, Cable, Drama as Tram } from 'lucide-react';
import { TransitMode, Route } from '../types/api';

interface TransportModeFilterProps {
  selectedModes: TransitMode[];
  onModeChange: (modes: TransitMode[]) => void;
  routes: Route[];
  filteredRoutes: Route[];
}

const TransportModeFilter: React.FC<TransportModeFilterProps> = ({
  selectedModes,
  onModeChange,
  routes,
  filteredRoutes
}) => {
  // Définir les modes avec leur route_type correspondant
  const modes = [
    { mode: TransitMode.SUBWAY, icon: Train, label: 'Métro', color: 'purple', routeType: 1 },
    { mode: TransitMode.RAIL, icon: Train, label: 'Train', color: 'blue', routeType: 2 },
    { mode: TransitMode.BUS, icon: Bus, label: 'Bus', color: 'green', routeType: 3 },
    { mode: TransitMode.TRAM, icon: Tram, label: 'Tramway', color: 'red', routeType: 0 },
    { mode: TransitMode.FERRY, icon: Ship, label: 'Ferry', color: 'cyan', routeType: 4 },
    { mode: TransitMode.CABLE_CAR, icon: Cable, label: 'Téléphérique', color: 'orange', routeType: 5 },
  ];

  // Calculer le nombre total de lignes par mode
  const totalModeStats = useMemo(() => {
    const stats = new Map<TransitMode, number>();
    routes.forEach(route => {
      const mode = route.mode as TransitMode;
      stats.set(mode, (stats.get(mode) || 0) + 1);
    });
    return stats;
  }, [routes]);

  // Calculer le nombre de lignes filtrées par mode
  const filteredModeStats = useMemo(() => {
    const stats = new Map<TransitMode, number>();
    filteredRoutes.forEach(route => {
      const mode = route.mode as TransitMode;
      stats.set(mode, (stats.get(mode) || 0) + 1);
    });
    return stats;
  }, [filteredRoutes]);

  // Récupérer uniquement les modes disponibles dans les lignes
  const availableModes = useMemo(() => {
    const uniqueModes = new Set<TransitMode>();
    routes.forEach(route => {
      if (route.mode) {
        uniqueModes.add(route.mode as TransitMode);
      }
    });
    return modes
      .filter(mode => uniqueModes.has(mode.mode))
      .sort((a, b) => a.routeType - b.routeType);
  }, [routes]);

  const handleModeClick = (mode: TransitMode) => {
    if (selectedModes.includes(mode)) {
      onModeChange(selectedModes.filter(m => m !== mode));
    } else {
      onModeChange([...selectedModes, mode]);
    }
  };

  if (availableModes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {availableModes.map(({ mode, icon: Icon, label, color }) => {
        const isSelected = selectedModes.includes(mode);
        const totalCount = totalModeStats.get(mode) || 0;
        const filteredCount = filteredModeStats.get(mode) || 0;
        
        return (
          <button
            key={mode}
            onClick={() => handleModeClick(mode)}
            className={`
              inline-flex items-center px-3 py-2 rounded-full
              transition-all duration-200 ease-in-out
              ${isSelected 
                ? `ring-2 ring-offset-2 ring-${color}-500 bg-${color}-100 text-${color}-700` 
                : `bg-gray-100 text-gray-700 hover:bg-${color}-50`
              }
            `}
            title={`Filtrer par ${label}`}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">{label}</span>
            <div className="ml-2 flex items-center space-x-1">
              <span className={`
                px-2 py-0.5 text-xs font-medium rounded-full
                ${isSelected ? `bg-${color}-200` : 'bg-gray-200'}
              `}>
                {filteredCount}
              </span>
              {filteredCount !== totalCount && (
                <span className="text-xs text-gray-500">/ {totalCount}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TransportModeFilter;