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
      const routes = await apiClient.getRoutesByAgency(operatorId);

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
  }
};