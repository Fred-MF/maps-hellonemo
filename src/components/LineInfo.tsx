import React from 'react';
import { Route } from '../types/api';
import { AlertCircle, Clock, MapPin } from 'lucide-react';

interface LineInfoProps {
  line: Route;
}

const LineInfo: React.FC<LineInfoProps> = ({ line }) => {
  return (
    <div className="space-y-6">
      {/* Description de la ligne */}
      {line.desc && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">{line.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Informations principales */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">
                Horaires de service
              </h3>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Premier départ : 05:30</p>
              <p>Dernier départ : 22:30</p>
              <p className="mt-2">Fréquence : 8-12 minutes</p>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">
                Points d'intérêt
              </h3>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <ul className="list-disc list-inside space-y-1">
                <li>Gare centrale</li>
                <li>Centre commercial</li>
                <li>Université</li>
                <li>Parc des expositions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Statistiques de la ligne
          </h3>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="px-4 py-5 bg-gray-50 shadow-sm rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Nombre d'arrêts
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {line.patterns?.[0]?.stops?.length || 0}
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow-sm rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Distance totale
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                12.5 km
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 shadow-sm rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Durée du trajet
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                35 min
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default LineInfo;