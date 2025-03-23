import axios, { AxiosError } from 'axios';
import { Feed, Route, Pattern, Stop } from '../types/api';

// Fonction pour créer un client API pour une région spécifique
export const createApiClient = (apiUrl: string) => {
  // Correction de la transformation de l'URL
  const baseUrl = apiUrl.endsWith('/graphiql') 
    ? apiUrl.replace('/graphiql', '/otp/routers/default/index/graphql')
    : apiUrl;
  
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
        console.error(`Réponse vide (${context})`);
        return getEmptyResponse<T>(context);
      }

      if (response.data.errors) {
        const errorMessages = response.data.errors
          .map((e: any) => e.message)
          .join(', ');
        console.error(`Erreur GraphQL (${context}):`, errorMessages);
        return getEmptyResponse<T>(context);
      }

      if (!response.data.data) {
        console.error(`Données manquantes (${context})`);
        return getEmptyResponse<T>(context);
      }

      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors du traitement de la réponse (${context}):`, error);
      return getEmptyResponse<T>(context);
    }
  };

  // Fonction utilitaire pour obtenir une réponse vide selon le contexte
  const getEmptyResponse = <T>(context: string): T => {
    switch (context) {
      case 'getFeeds':
        return { feeds: [] } as T;
      case 'getAgenciesByFeed':
        return { feeds: [] } as T;
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
    // Récupérer tous les feeds disponibles
    getFeeds: async (): Promise<Feed[]> => {
      const query = `
        query {
          feeds {
            feedId
            agencies {
              id
              name
              url
              timezone
              lang
              phone
              fareUrl
            }
          }
        }
      `;

      try {
        console.log('Requête GraphQL getFeeds:', {
          url: baseUrl,
          query
        });

        const response = await client.post('', { query });
        console.log('Réponse brute getFeeds:', response.data);

        const data = handleGraphQLResponse<{ feeds: Feed[] }>(response, 'getFeeds');
        return data.feeds || [];
      } catch (error) {
        console.error('Erreur lors de la récupération des feeds:', error);
        if (error instanceof AxiosError) {
          console.error('Détails de l\'erreur:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        return [];
      }
    },

    // Récupérer les agences d'un feed spécifique
    getAgenciesByFeed: async (feedId: string) => {
      const query = `
        query {
          feeds {
            feedId
            agencies {
              id
              gtfsId
              name
              url
              timezone
              lang
              phone
              fareUrl
            }
          }
        }
      `;

      try {
        console.log('Requête GraphQL getAgenciesByFeed:', {
          url: baseUrl,
          feedId,
          query
        });

        const response = await client.post('', { query });
        console.log('Réponse brute getAgenciesByFeed:', response.data);

        const data = handleGraphQLResponse<{ feeds: { feedId: string; agencies: any[] }[] }>(response, 'getAgenciesByFeed');
        // Trouver le feed correspondant et retourner ses agences
        const feed = data.feeds?.find(f => f.feedId === feedId);
        return feed?.agencies || [];
      } catch (error) {
        console.error(`Erreur lors de la récupération des agences du feed ${feedId}:`, error);
        if (error instanceof AxiosError) {
          console.error('Détails de l\'erreur:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        return [];
      }
    },

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
        console.log('Requête GraphQL getRoutesByAgency:', {
          url: baseUrl,
          agencyId,
          query
        });

        const response = await client.post('', { 
          query,
          variables: { agencyId }
        });

        console.log('Réponse brute getRoutesByAgency:', response.data);

        const data = handleGraphQLResponse<{ agency: { routes: Route[] } }>(response, 'getRoutesByAgency');
        const routes = data.agency?.routes || [];
        
        console.log('Routes extraites:', routes);
        return routes;
      } catch (error) {
        console.error(`Erreur lors de la récupération des routes de l'agence ${agencyId}:`, error);
        if (error instanceof AxiosError) {
          console.error('Détails de l\'erreur:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
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
        console.log('Requête GraphQL getRouteDetails:', {
          url: baseUrl,
          routeId,
          query
        });

        const response = await client.post('', { 
          query,
          variables: { routeId }
        });

        console.log('Réponse brute getRouteDetails:', response.data);

        const data = handleGraphQLResponse<{ route: Route | null }>(response, 'getRouteDetails');
        return data.route;
      } catch (error) {
        console.error(`Erreur lors de la récupération des détails de la route ${routeId}:`, error);
        if (error instanceof AxiosError) {
          console.error('Détails de l\'erreur:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        return null;
      }
    },

    // Récupérer les patterns d'une route spécifique
    getPatternsByRoute: async (routeId: string): Promise<Pattern[]> => {
      const query = `
        query PatternsByRoute($routeId: String!) {
          route(id: $routeId) {
            patterns {
              code
              name
              headsign
              directionId
              patternGeometry {
                points
                length
              }
              stops {
                gtfsId
                name
                code
                lat
                lon
              }
              trips {
                gtfsId
                tripHeadsign
                serviceId
              }
            }
          }
        }
      `;

      try {
        console.log('Requête GraphQL getPatternsByRoute:', {
          url: baseUrl,
          routeId,
          query
        });

        const response = await client.post('', { 
          query,
          variables: { routeId }
        });

        console.log('Réponse brute getPatternsByRoute:', response.data);

        const data = handleGraphQLResponse<{ route: { patterns: Pattern[] } }>(response, 'getPatternsByRoute');
        return data.route?.patterns || [];
      } catch (error) {
        console.error(`Erreur lors de la récupération des patterns de la route ${routeId}:`, error);
        if (error instanceof AxiosError) {
          console.error('Détails de l\'erreur:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        return [];
      }
    },

    // Récupérer les arrêts d'un pattern spécifique
    getStopsByPattern: async (patternId: string): Promise<Stop[]> => {
      const query = `
        query StopsByPattern($patternId: String!) {
          pattern(id: $patternId) {
            stops {
              gtfsId
              name
              code
              desc
              lat
              lon
              zoneId
              platformCode
              wheelchairBoarding
            }
          }
        }
      `;

      try {
        console.log('Requête GraphQL getStopsByPattern:', {
          url: baseUrl,
          patternId,
          query
        });

        const response = await client.post('', { 
          query,
          variables: { patternId }
        });

        console.log('Réponse brute getStopsByPattern:', response.data);

        const data = handleGraphQLResponse<{ pattern: { stops: Stop[] } }>(response, 'getStopsByPattern');
        return data.pattern?.stops || [];
      } catch (error) {
        console.error(`Erreur lors de la récupération des arrêts du pattern ${patternId}:`, error);
        if (error instanceof AxiosError) {
          console.error('Détails de l\'erreur:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
        return [];
      }
    }
  };
};