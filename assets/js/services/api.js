/**
 * Service d'intégration avec l'API OTP MaaSify
 */

// Configuration pour les différentes régions API
const API_CONFIG = {
  'ile-de-france': {
    url: 'https://otp-idf.maasify.io/graphiql',
    feedId: 'IDF'
  },
  'auvergne-rhone-alpes': {
    url: 'https://otp-ara.maasify.io/graphiql',
    feedId: 'ARA'
  },
  'provence-alpes-cote-dazur': {
    url: 'https://otp-paca.maasify.io/graphiql',
    feedId: 'PACA'
  }
  // Ajouter d'autres régions selon le besoin
};

// Cache pour les requêtes
const apiCache = new Map();
const CACHE_DURATION = {
  NETWORKS: 24 * 60 * 60 * 1000, // 24h pour les réseaux
  LINES: 6 * 60 * 60 * 1000,     // 6h pour les lignes
  STOPS: 6 * 60 * 60 * 1000,     // 6h pour les arrêts
  TIMETABLES: 15 * 60 * 1000,    // 15min pour les horaires
  REALTIME: 30 * 1000            // 30s pour les données temps réel
};

/**
 * Classe principale d'interaction avec l'API MaaSify
 */
class MaaSifyAPI {
  constructor(region) {
    this.region = region;
    this.config = API_CONFIG[region] || API_CONFIG['ile-de-france']; // Par défaut
    this.apiUrl = this.config.url;
    this.feedId = this.config.feedId;
  }

  /**
   * Exécute une requête GraphQL
   * @param {string} query - Requête GraphQL
   * @param {Object} variables - Variables pour la requête
   * @param {string} cacheKey - Clé pour le cache
   * @param {number} cacheDuration - Durée de vie du cache en ms
   * @returns {Promise<Object>} Données de réponse
   */
  async executeQuery(query, variables = {}, cacheKey = null, cacheDuration = 0) {
    try {
      // Vérifier si la réponse est dans le cache
      if (cacheKey) {
        const cachedItem = apiCache.get(cacheKey);
        if (cachedItem && (Date.now() - cachedItem.timestamp) < cacheDuration) {
          console.log(`[API] Utilisation du cache pour : ${cacheKey}`);
          return cachedItem.data;
        }
      }

      // Construction de la requête
      const body = JSON.stringify({
        query,
        variables
      });

      // Exécution de la requête
      console.log(`[API] Requête API vers ${this.apiUrl}`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Stockage dans le cache si nécessaire
      if (cacheKey && cacheDuration > 0) {
        apiCache.set(cacheKey, {
          timestamp: Date.now(),
          data: data.data
        });
      }

      return data.data;
    } catch (error) {
      console.error('Erreur lors de la requête API:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des agences pour la région
   * @returns {Promise<Array>} Liste des agences
   */
  async getAgencies() {
    const query = `
      query {
        agencies {
          id
          gtfsId
          name
          url
          phone
          routes {
            gtfsId
            shortName
            longName
            mode
          }
        }
      }
    `;

    const cacheKey = `agencies_${this.feedId}`;
    const result = await this.executeQuery(query, {}, cacheKey, CACHE_DURATION.NETWORKS);
    return result.agencies;
  }

  /**
   * Récupère les détails d'une agence spécifique
   * @param {string} agencyId - ID de l'agence
   * @returns {Promise<Object>} Détails de l'agence
   */
  async getAgency(agencyId) {
    const query = `
      query($id: String!) {
        agency(id: $id) {
          id
          gtfsId
          name
          url
          phone
          routes {
            gtfsId
            shortName
            longName
            mode
          }
        }
      }
    `;

    const variables = { id: agencyId };
    const cacheKey = `agency_${agencyId}`;
    const result = await this.executeQuery(query, variables, cacheKey, CACHE_DURATION.NETWORKS);
    return result.agency;
  }

  /**
   * Récupère les routes (lignes) d'une agence
   * @param {string} agencyId - ID de l'agence
   * @returns {Promise<Array>} Liste des routes
   */
  async getRoutes(agencyId = null) {
    let query = `
      query($feeds: [String], $transportModes: [Mode]) {
        routes(feeds: $feeds, transportModes: $transportModes) {
          gtfsId
          shortName
          longName
          mode
          type
          desc
          url
          color
          textColor
          agency {
            gtfsId
            name
          }
          alerts {
            alertEffect
            alertCause
            alertSeverityLevel
            alertDescriptionText
          }
        }
      }
    `;

    const variables = {
      feeds: agencyId ? null : [this.feedId],
      transportModes: null
    };

    if (agencyId) {
      query = `
        query($id: String!) {
          agency(id: $id) {
            routes {
              gtfsId
              shortName
              longName
              mode
              type
              desc
              url
              color
              textColor
              alerts {
                alertEffect
                alertCause
                alertSeverityLevel
                alertDescriptionText
              }
            }
          }
        }
      `;
      variables.id = agencyId;
    }

    const cacheKey = agencyId ? `routes_agency_${agencyId}` : `routes_feed_${this.feedId}`;
    const result = await this.executeQuery(query, variables, cacheKey, CACHE_DURATION.LINES);
    
    return agencyId ? result.agency.routes : result.routes;
  }

  /**
   * Récupère les détails d'une route spécifique
   * @param {string} routeId - ID de la route
   * @returns {Promise<Object>} Détails de la route
   */
  async getRoute(routeId) {
    const query = `
      query($id: String!) {
        route(id: $id) {
          gtfsId
          shortName
          longName
          mode
          type
          desc
          url
          color
          textColor
          agency {
            gtfsId
            name
          }
          patterns {
            code
            name
            directionId
            headsign
            stops {
              gtfsId
              name
              lat
              lon
              code
            }
          }
          alerts {
            alertEffect
            alertCause
            alertSeverityLevel
            alertDescriptionText
          }
        }
      }
    `;

    const variables = { id: routeId };
    const cacheKey = `route_${routeId}`;
    const result = await this.executeQuery(query, variables, cacheKey, CACHE_DURATION.LINES);
    return result.route;
  }

  /**
   * Récupère les arrêts par zone géographique
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} radius - Rayon de recherche en mètres
   * @returns {Promise<Array>} Liste des arrêts
   */
  async getStopsByRadius(lat, lon, radius = 500) {
    const query = `
      query($lat: Float!, $lon: Float!, $radius: Int!) {
        stopsByRadius(lat: $lat, lon: $lon, radius: $radius) {
          edges {
            node {
              stop {
                gtfsId
                name
                code
                lat
                lon
                wheelchairBoarding
                routes {
                  gtfsId
                  shortName
                  longName
                  mode
                }
              }
              distance
            }
          }
        }
      }
    `;

    const variables = { lat, lon, radius };
    // Pas de cache pour cette requête car elle dépend de la position
    const result = await this.executeQuery(query, variables);
    return result.stopsByRadius.edges.map(edge => ({
      ...edge.node.stop,
      distance: edge.node.distance
    }));
  }

  /**
   * Récupère les détails d'un arrêt spécifique
   * @param {string} stopId - ID de l'arrêt
   * @returns {Promise<Object>} Détails de l'arrêt
   */
  async getStop(stopId) {
    const query = `
      query($id: String!) {
        stop(id: $id) {
          gtfsId
          name
          code
          desc
          lat
          lon
          wheelchairBoarding
          locationType
          parentStation {
            gtfsId
            name
          }
          routes {
            gtfsId
            shortName
            longName
            mode
            color
          }
          alerts {
            alertEffect
            alertCause
            alertSeverityLevel
            alertDescriptionText
          }
        }
      }
    `;

    const variables = { id: stopId };
    const cacheKey = `stop_${stopId}`;
    const result = await this.executeQuery(query, variables, cacheKey, CACHE_DURATION.STOPS);
    return result.stop;
  }

  /**
   * Récupère les prochains départs d'un arrêt
   * @param {string} stopId - ID de l'arrêt
   * @param {number} numberOfDepartures - Nombre de départs à récupérer
   * @returns {Promise<Array>} Liste des prochains départs
   */
  async getStopDepartures(stopId, numberOfDepartures = 10) {
    const query = `
      query($id: String!, $numberOfDepartures: Int!) {
        stop(id: $id) {
          gtfsId
          name
          stoptimesWithoutPatterns(numberOfDepartures: $numberOfDepartures) {
            scheduledArrival
            realtimeArrival
            arrivalDelay
            scheduledDeparture
            realtimeDeparture
            departureDelay
            realtime
            realtimeState
            serviceDay
            headsign
            trip {
              gtfsId
              route {
                gtfsId
                shortName
                longName
                mode
                color
              }
            }
          }
        }
      }
    `;

    const variables = { id: stopId, numberOfDepartures };
    // Pas de cache pour cette requête car elle contient des données temps réel
    const result = await this.executeQuery(query, variables);
    
    if (!result.stop || !result.stop.stoptimesWithoutPatterns) {
      return [];
    }
    
    return result.stop.stoptimesWithoutPatterns.map(stoptime => {
      const departureTime = new Date((stoptime.serviceDay + stoptime.realtimeDeparture) * 1000);
      
      return {
        scheduledTime: new Date((stoptime.serviceDay + stoptime.scheduledDeparture) * 1000),
        realTime: departureTime,
        delay: stoptime.departureDelay,
        realtime: stoptime.realtime,
        realtimeState: stoptime.realtimeState,
        headsign: stoptime.headsign,
        routeShortName: stoptime.trip.route.shortName,
        routeLongName: stoptime.trip.route.longName,
        routeMode: stoptime.trip.route.mode,
        routeColor: stoptime.trip.route.color,
        tripId: stoptime.trip.gtfsId
      };
    });
  }

  /**
   * Planifie un itinéraire entre deux points
   * @param {Object} fromCoord - Coordonnées de départ {lat, lon}
   * @param {Object} toCoord - Coordonnées d'arrivée {lat, lon}
   * @param {string} date - Date au format YYYY-MM-DD
   * @param {string} time - Heure au format HH:MM:SS
   * @returns {Promise<Object>} Plan d'itinéraire
   */
  async planTrip(fromCoord, toCoord, date = null, time = null) {
    // Si la date et l'heure ne sont pas fournies, utiliser la date et l'heure actuelles
    if (!date || !time) {
      const now = new Date();
      date = now.toISOString().split('T')[0];
      time = now.toTimeString().split(' ')[0];
    }

    const query = `
      query($from: InputCoordinates!, $to: InputCoordinates!, $date: String!, $time: String!) {
        plan(
          from: $from,
          to: $to,
          date: $date,
          time: $time,
          numItineraries: 3,
          walkReluctance: 2.0
        ) {
          itineraries {
            duration
            walkDistance
            walkTime
            waitingTime
            legs {
              mode
              startTime {
                scheduledTime
                estimated {
                  time
                  delay
                }
              }
              endTime {
                scheduledTime
                estimated {
                  time
                  delay
                }
              }
              duration
              realTime
              distance
              transitLeg
              from {
                name
                lat
                lon
                stop {
                  gtfsId
                  name
                  code
                }
              }
              to {
                name
                lat
                lon
                stop {
                  gtfsId
                  name
                  code
                }
              }
              route {
                gtfsId
                shortName
                longName
                mode
                color
              }
              trip {
                gtfsId
                tripHeadsign
              }
              legGeometry {
                points
              }
            }
          }
        }
      }
    `;

    const variables = {
      from: fromCoord,
      to: toCoord,
      date,
      time
    };

    // Pas de cache pour cette requête
    const result = await this.executeQuery(query, variables);
    return result.plan;
  }
}

// Exportation de la classe
export default MaaSifyAPI;