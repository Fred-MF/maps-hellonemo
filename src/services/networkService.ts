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
          name,
          display_name,
          region_id,
          is_available,
          last_check,
          error_message,
          operators (
            id,
            name,
            gtfs_id,
            feed_id,
            is_active
          )
        `)
        .eq('is_available', true)
        .order('name');

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
          name,
          display_name,
          region_id,
          is_available,
          last_check,
          error_message,
          operators (
            id,
            name,
            gtfs_id,
            feed_id,
            is_active
          )
        `)
        .eq('region_id', regionId)
        .eq('is_available', true)
        .order('name');

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
        'ID',
        'Nom',
        "Nom d'affichage",
        'Région',
        'Disponible',
        'Dernière vérification',
        'Message d\'erreur',
        'Opérateurs'
      ].join(',');

      // Lignes de données
      const rows = networks.map(network => {
        const operatorNames = network.operators
          ? network.operators
              .filter(op => op.is_active)
              .map(op => op.name)
              .join(';')
          : '';

        return [
          network.id,
          `"${network.name}"`,
          network.display_name ? `"${network.display_name}"` : '',
          network.region_id,
          network.is_available ? 'Oui' : 'Non',
          network.last_check ? new Date(network.last_check).toLocaleString('fr-FR') : '',
          network.error_message ? `"${network.error_message}"` : '',
          operatorNames ? `"${operatorNames}"` : ''
        ].join(',');
      });

      // Combiner les en-têtes et les lignes
      return [headers, ...rows].join('\n');
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      throw new Error('Erreur lors de l\'export des réseaux');
    }
  }
};