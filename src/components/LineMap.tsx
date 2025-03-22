import React, { useEffect, useRef } from 'react';
import { Route } from '../types/api';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LineMapProps {
  line: Route;
  apiKey: string;
}

const LineMap: React.FC<LineMapProps> = ({ line, apiKey }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    maptilersdk.config.apiKey = apiKey;
    
    // Créer la carte
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [2.3522, 48.8566], // Paris par défaut
      zoom: 13
    });

    // Ajouter les marqueurs et le tracé quand la carte est chargée
    map.current.on('load', () => {
      if (!map.current || !line.patterns?.[0]?.stops) return;

      // Utiliser le tracé GTFS s'il existe, sinon utiliser les arrêts
      const coordinates = line.shape?.shape_points || 
        line.patterns[0].stops
          .filter(stop => stop.lon && stop.lat)
          .map(stop => [stop.lon, stop.lat]);

      if (coordinates.length > 0) {
        // Centrer la carte sur le premier arrêt
        map.current.setCenter(coordinates[0]);

        // Ajouter le tracé de la ligne
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': `#${line.color || '3b82f6'}`,
            'line-width': 4
          }
        });

        // Ajouter les marqueurs pour chaque arrêt
        line.patterns[0].stops.forEach((stop) => {
          if (!stop.lon || !stop.lat) return;

          // Créer un élément DOM pour le marqueur
          const el = document.createElement('div');
          el.className = 'flex items-center justify-center w-3 h-3 bg-white rounded-full shadow-lg';
          el.style.border = `2px solid #${line.color || '3b82f6'}`;

          // Formater les horaires
          const formatTime = (time: string | undefined) => {
            if (!time) return null;
            return format(new Date(time), 'HH:mm', { locale: fr });
          };

          const scheduledTime = formatTime(stop.scheduledDeparture || stop.scheduledArrival);
          const realtimeTime = formatTime(stop.realtimeDeparture || stop.realtimeArrival);

          // Ajouter le marqueur à la carte
          new maptilersdk.Marker({
            element: el,
            anchor: 'center'
          })
            .setLngLat([stop.lon, stop.lat])
            .setPopup(
              new maptilersdk.Popup({ offset: 25 })
                .setHTML(`
                  <div class="p-3">
                    <div class="font-medium text-gray-900">${stop.name}</div>
                    ${stop.desc ? `<div class="text-sm text-gray-500 mt-1">${stop.desc}</div>` : ''}
                    ${scheduledTime ? `
                      <div class="mt-2 space-y-1">
                        <div class="text-sm">
                          <span class="font-medium">Horaire prévu :</span> ${scheduledTime}
                        </div>
                        ${realtimeTime && realtimeTime !== scheduledTime ? `
                          <div class="text-sm text-red-600">
                            <span class="font-medium">Horaire temps réel :</span> ${realtimeTime}
                          </div>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                `)
            )
            .addTo(map.current);
        });

        // Ajuster la vue pour montrer tout le tracé
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as [number, number]);
        }, new maptilersdk.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));

        map.current.fitBounds(bounds, {
          padding: 50
        });
      }
    });

    // Gérer le redimensionnement de la carte
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [line, apiKey]);

  return (
    <div ref={mapContainer} className="absolute inset-0" style={{ height: 'calc(100vh - 144px)' }} />
  );
};

export default LineMap;