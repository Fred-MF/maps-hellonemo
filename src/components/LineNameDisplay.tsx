import React from 'react';
import { Clock } from 'lucide-react';

interface LineNameDisplayProps {
  shortName: string;
  longName: string;
  hasRealtimeData?: boolean;
}

const LineNameDisplay: React.FC<LineNameDisplayProps> = ({
  shortName,
  longName,
  hasRealtimeData = false
}) => {
  // Fonction pour standardiser le nom de la ligne
  const formatLineName = (name: string): string => {
    // Supprimer les flèches à la fin
    let formattedName = name.trim().replace(/[→←↔-]+$/, '');

    // Remplacer les différents séparateurs par les flèches appropriées
    formattedName = formattedName
      // Traiter d'abord les cas bidirectionnels
      .replace(/\s*<->\s*|\s*<>\s*/g, ' ↔ ')
      // Puis les cas unidirectionnels
      .replace(/\s*(?:->|-->|-|–)\s*/g, ' → ')
      .replace(/\s*\/\s*/g, ' ou ');

    // Ajouter "(Circulaire)" pour les lignes circulaires
    if (formattedName.toLowerCase().includes('circulaire')) {
      formattedName = formattedName.replace(/\s*\(?circulaire\)?/i, '') + ' (Circulaire)';
    }

    return formattedName;
  };

  return (
    <div className="flex items-center space-x-1.5">
      <div className="truncate">{formatLineName(longName)}</div>
      {hasRealtimeData && (
        <div 
          className="flex-shrink-0 text-green-600" 
          title="Information en temps réel disponible"
        >
          <Clock className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default LineNameDisplay;