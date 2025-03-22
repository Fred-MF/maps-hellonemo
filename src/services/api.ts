import axios, { AxiosError } from 'axios';
import { Feed, Route, Pattern, Stop } from '../types/api';

// Fonction pour créer un client API pour une région spécifique
export const createApiClient = (apiUrl: string) => {
  const baseUrl = apiUrl.replace('/graphiql', '/otp/routers/default/index/graphql');
  
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
  });

  // Fonction utilitaire pour gérer les réponses GraphQL
  const handleGraphQLResponse = <T>(response: any, context: string): T => {
    try {
      if (!response?.data) {
        console.warn(`Réponse vide (${context})`);
        return getEmptyResponse<T>(context);
      }

      if (response.data.errors) {
        const errorMessages = response.data.errors
          .map((e: any) => e.message)
          .join(', ');
        console.warn(`Avertissement GraphQL (${context}): ${errorMessages}`);
        return getEmptyResponse<T>(context);
      }

      if (!response.data.data) {
        console.warn(`Données manquantes (${context})`);
        return getEmptyResponse<T>(context);
      }

      return response.data.data;
    } catch (error) {
      console.warn(`Erreur lors du traitement de la réponse (${context}):`, error);
      return getEmptyResponse<T>(context);
    }
  };

  // Fonction utilitaire pour obtenir une réponse vide selon le contexte
  const getEmptyResponse = <T>(context: string): T => {
    switch (context) {
      case 'getFeeds':
        return { feeds: [] } as T;
      case 'getAgenciesByFeed':
        return { agencies: [] } as T;
      case 'getRoutesByAgency':
        return { agency: { routes: [] } } as T;
      case 'getRouteDetails':
        return { route: null } as T;
      case 'getPatternsByRoute':
        return { route: { patterns: [] } } as T;
      case 'getStopsByPattern':
        return { pattern: { stops: [] } } as T;
      default:
        return {} as T;
    }
  };

  return {
    // Récupérer les routes d'une agence spécifique
    getRoutesByAgency: async (agencyId: string): Promise<Route[]> => {
      const query = `
        query RoutesByAgency($agencyId: String!) {
          agency(id: $agencyId) {
            routes {
              gtfsId
              shortName
              longName
              mode
              type
              color
              textColor
              patterns {
                code
                name
                stops {
                  gtfsId
                  name
                  code
                  lat
                  lon
                }
              }
            }
          }
        }
      `;

      try {
        const response = await client.post('', { 
          query,
          variables: { agencyId }
        });
        const data = handleGraphQLResponse<{ agency: { routes: Route[] } }>(response, 'getRoutesByAgency');
        return data.agency?.routes || [];
      } catch (error) {
        console.warn(`Erreur lors de la récupération des routes de l'agence ${agencyId}:`, error);
        return [];
      }
    },

    // Récupérer les détails d'une route spécifique
    getRouteDetails: async (routeId: string): Promise<Route | null> => {
      const query = `
        query RouteDetails($routeId: String!) {
          route(id: $routeId) {
            gtfsId
            shortName
            longName
            mode
            type
            color
            textColor
            desc
            patterns {
              code
              name
              headsign
              directionId
              stops {
                gtfsId
                name
                code
                desc
                lat
                lon
                zoneId
                platformCode
              }
            }
          }
        }
      `;

      try {
        const response = await client.post('', { 
          query,
          variables: { routeId }
        });
        const data = handleGraphQLResponse<{ route: Route | null }>(response, 'getRouteDetails');
        return data.route;
      } catch (error) {
        console.warn(`Erreur lors de la récupération des détails de la route ${routeId}:`, error);
        return null;
      }
    }
  };
};