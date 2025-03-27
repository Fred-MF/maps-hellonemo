import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Bus, MapPin, ArrowRight } from 'lucide-react';
import Fuse from 'fuse.js';
import { Route, TransitMode } from '../types/api';

interface GlobalSearchProps {
  routes: Route[];
  selectedModes: TransitMode[];
  onSearch: (searchTerm: string) => void;
  filteredCount?: number;
}

interface Suggestion {
  type: 'line' | 'destination' | 'stop';
  value: string;
  details?: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  routes,
  selectedModes,
  onSearch,
  filteredCount
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Configuration de Fuse.js pour la recherche floue
  const fuse = useMemo(() => new Fuse(routes, {
    keys: [
      'shortName',
      'longName',
      'mode',
      'patterns.stops.name'
    ],
    threshold: 0.3,
    includeMatches: true
  }), [routes]);

  // Gestionnaire de clic en dehors du composant
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Générer les suggestions basées sur la recherche
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    const results = fuse.search(searchTerm);
    const uniqueSuggestions = new Map<string, Suggestion>();

    results.forEach(result => {
      // Ajouter la ligne
      if (result.item.shortName) {
        const key = `line-${result.item.shortName}`;
        if (!uniqueSuggestions.has(key)) {
          uniqueSuggestions.set(key, {
            type: 'line',
            value: result.item.shortName,
            details: result.item.longName
          });
        }
      }

      // Ajouter la destination
      if (result.item.longName) {
        const [origin, destination] = result.item.longName.split(' - ');
        if (destination) {
          const key = `destination-${destination}`;
          if (!uniqueSuggestions.has(key)) {
            uniqueSuggestions.set(key, {
              type: 'destination',
              value: destination,
              details: `Ligne ${result.item.shortName}`
            });
          }
        }
      }

      // Ajouter les arrêts
      result.item.patterns?.forEach(pattern => {
        pattern.stops?.forEach(stop => {
          if (stop.name) {
            const key = `stop-${stop.name}`;
            if (!uniqueSuggestions.has(key)) {
              uniqueSuggestions.set(key, {
                type: 'stop',
                value: stop.name,
                details: `Ligne ${result.item.shortName}`
              });
            }
          }
        });
      });
    });

    setSuggestions(Array.from(uniqueSuggestions.values()).slice(0, 5));
  }, [searchTerm, fuse]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    handleSearch(suggestion.value);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch(searchTerm);
    }
  };

  const getSuggestionIcon = (type: 'line' | 'destination' | 'stop') => {
    switch (type) {
      case 'line':
        return <Bus className="h-4 w-4 text-blue-500" />;
      case 'destination':
        return <ArrowRight className="h-4 w-4 text-green-500" />;
      case 'stop':
        return <MapPin className="h-4 w-4 text-red-500" />;
    }
  };

  const getSuggestionLabel = (type: 'line' | 'destination' | 'stop') => {
    switch (type) {
      case 'line':
        return 'Ligne';
      case 'destination':
        return 'Destination';
      case 'stop':
        return 'Arrêt';
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full max-w-2xl" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Rechercher une ligne par numéro, nom, destination..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && showSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center">
                    <div className="flex items-center space-x-2 min-w-[100px]">
                      {getSuggestionIcon(suggestion.type)}
                      <span className="text-sm text-gray-500">
                        {getSuggestionLabel(suggestion.type)}
                      </span>
                    </div>
                    <div className="ml-2">
                      <div className="font-medium">{suggestion.value}</div>
                      {suggestion.details && (
                        <div className="text-sm text-gray-500">{suggestion.details}</div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Nombre de résultats */}
      {searchTerm && typeof filteredCount !== 'undefined' && (
        <div className="text-sm text-gray-600">
          {filteredCount} résultat{filteredCount > 1 ? 's' : ''} trouvé{filteredCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;