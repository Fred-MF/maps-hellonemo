import { supabase } from '../lib/supabase';
import { createApiClient } from './api';
import { Network, Operator, Route } from '../types/api';
import { regions } from '../data/regions';

export const networkService = {
  // Récupérer tous les réseaux
  async getAllNetworks(): Promise<Network[]> {
    try {
      const { data, error } = await supabase
        .from('networks')
        .select(`
          id,
          feed_id,
          display_name,
          region_id,
          is_available,
          last_check,
          error_message,
          operators (
            id,
            agency_id,
            name,
            display_name,
            gtfs_id,
            is_active
          )
        `)
        .order('feed_id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des réseaux:', error);
      return [];
    }
  },

  // Récupérer les réseaux par région
  async getNetworksByRegion(regionId: string): Promise<Network[]> {
    try {
      const { data, error } = await supabase
        .from('networks')
        .select(`
          id,
          feed_id,
          display_name,
          region_id,
          is_available,
          last_check,
          error_message,
          operators (
            id,
            agency_id,
            name,
            display_name,
            gtfs_id,
            is_active
          )
        `)
        .eq('region_id', regionId)
        .order('feed_id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des réseaux:', error);
      return [];
    }
  },

  // Récupérer les routes d'un opérateur
  async getOperatorRoutes(operatorId: string, regionId: string): Promise<Route[]> {
    try {
      const region = regions.find(r => r.id === regionId);
      if (!region) throw new Error('Région non trouvée');

      const apiClient = createApiClient(region.apiUrl);
      
      // Formater l'ID de l'opérateur correctement
      const formattedOperatorId = operatorId.includes(':') 
        ? operatorId.split(':').slice(-2).join(':') // Prendre les 2 derniers segments
        : `${regionId}:${operatorId}`;

      console.log('Récupération des routes pour:', formattedOperatorId);
      const routes = await apiClient.getRoutesByAgency(formattedOperatorId);
      console.log('Routes récupérées:', routes);

      // Trier les routes par nom court
      return routes.sort((a, b) => {
        const aNum = parseInt(a.shortName);
        const bNum = parseInt(b.shortName);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.shortName.localeCompare(b.shortName);
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des routes:', error);
      return [];
    }
  },

  // Récupérer les détails d'une route
  async getOperatorRouteDetails(routeId: string, regionId: string): Promise<Route | null> {
    try {
      const region = regions.find(r => r.id === regionId);
      if (!region) throw new Error('Région non trouvée');

      const apiClient = createApiClient(region.apiUrl);
      const route = await apiClient.getRouteDetails(routeId);
      
      if (!route) return null;

      // Extraire l'origine et la destination du nom long
      const [origin, destination] = route.longName.split(' - ');

      return {
        ...route,
        origin,
        destination
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la route:', error);
      return null;
    }
  },

  // Exporter les réseaux au format CSV
  async exportNetworksToCSV(): Promise<string> {
    try {
      const networks = await this.getAllNetworks();
      
      // En-têtes du CSV
      const headers = [
        'networks/id',
        'networks/feed_id',
        'networks/display_name',
        'networks/region_id',
        'networks/is_available',
        'networks/last_check',
        'networks/error_message',
        'operators/id',
        'operators/agency_id',
        'operators/name',
        'operators/display_name',
        'operators/gtfs_id',
        'operators/is_active'
      ].join(',');

      // Lignes de données
      const rows: string[] = [];
      
      // Pour chaque réseau, créer une ligne par opérateur
      networks.forEach(network => {
        if (network.operators && network.operators.length > 0) {
          // Une ligne par opérateur
          network.operators.forEach(operator => {
            rows.push([
              network.id,
              network.feed_id,
              network.display_name ? `"${network.display_name}"` : '',
              network.region_id,
              network.is_available ? 'true' : 'false',
              network.last_check ? new Date(network.last_check).toLocaleString('fr-FR') : '',
              network.error_message ? `"${network.error_message}"` : '',
              operator.id,
              operator.agency_id,
              `"${operator.name}"`,
              operator.display_name ? `"${operator.display_name}"` : '',
              operator.gtfs_id,
              operator.is_active ? 'true' : 'false'
            ].join(','));
          });
        } else {
          // Réseau sans opérateur
          rows.push([
            network.id,
            network.feed_id,
            network.display_name ? `"${network.display_name}"` : '',
            network.region_id,
            network.is_available ? 'true' : 'false',
            network.last_check ? new Date(network.last_check).toLocaleString('fr-FR') : '',
            network.error_message ? `"${network.error_message}"` : '',
            '',
            '',
            '',
            '',
            '',
            ''
          ].join(','));
        }
      });

      // Combiner les en-têtes et les lignes
      return [headers, ...rows].join('\n');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      throw new Error('Erreur lors de l\'export des réseaux');
    }
  }
};