import { supabase } from '../lib/supabase';
import { createApiClient } from './api';
import { regions } from '../data/regions';

const BATCH_SIZE = 50; // Process 50 items at a time

export const networkCheckService = {
  // Vérifier tous les réseaux d'une région
  async checkAllNetworks(regionId: string) {
    try {
      console.log('Vérification des réseaux pour la région:', regionId);

      // Récupérer la région
      const region = regions.find(r => r.id === regionId);
      if (!region) {
        throw new Error('Région non trouvée');
      }

      // Créer le client API
      const apiClient = createApiClient(region.apiUrl);

      // Récupérer tous les feeds disponibles
      const feeds = await apiClient.getFeeds();
      console.log('Feeds récupérés:', feeds.length);

      let imported = 0;
      let total = 0;
      const errors: string[] = [];
      const processedNetworkIds = new Set<string>();

      // Pour chaque feed, récupérer et traiter les agences
      for (const feed of feeds) {
        try {
          const agencies = await apiClient.getAgenciesByFeed(feed.feedId);
          total += agencies.length;

          // Créer ou mettre à jour le réseau
          const networkId = `${region.id}:${feed.feedId}`;
          processedNetworkIds.add(networkId);

          const { data: network, error: networkError } = await supabase
            .from('networks')
            .upsert({
              id: networkId,
              feed_id: feed.feedId,
              region_id: region.id,
              is_available: true,
              last_check: new Date().toISOString(),
              error_message: null
            })
            .select()
            .single();

          if (networkError) throw networkError;

          // Pour chaque agence, créer ou mettre à jour l'opérateur
          for (const agency of agencies) {
            try {
              const { data: operator, error: operatorError } = await supabase
                .from('operators')
                .upsert({
                  network_id: networkId,
                  agency_id: agency.id,
                  name: agency.name,
                  gtfs_id: agency.gtfsId,
                  is_active: true
                }, {
                  onConflict: 'network_id,gtfs_id'
                })
                .select('id')
                .single();

              if (operatorError) throw operatorError;
              if (operator) {
                imported++;
              }

            } catch (error) {
              console.error('Erreur lors du traitement de l\'agence:', error);
              errors.push(`Erreur pour l'agence ${agency.name}: ${error.message}`);
            }
          }
        } catch (error) {
          console.error('Erreur lors du traitement du feed:', error);
          errors.push(`Erreur pour le feed ${feed.feedId}: ${error.message}`);
        }
      }

      // Marquer comme indisponibles les réseaux qui n'ont pas été trouvés dans l'API
      if (processedNetworkIds.size > 0) {
        const networkIds = Array.from(processedNetworkIds);
        
        // Traiter les réseaux par lots
        for (let i = 0; i < networkIds.length; i += BATCH_SIZE) {
          const batch = networkIds.slice(i, i + BATCH_SIZE);
          const { error: updateNetworksError } = await supabase
            .from('networks')
            .update({
              is_available: false,
              last_check: new Date().toISOString(),
              error_message: 'Réseau non trouvé lors de la dernière vérification'
            })
            .eq('region_id', region.id)
            .not('id', 'in', batch);

          if (updateNetworksError) {
            console.error('Erreur lors de la mise à jour des réseaux inactifs:', updateNetworksError);
            errors.push(`Erreur lors de la désactivation des réseaux: ${updateNetworksError.message}`);
          }
        }
      }

      return {
        success: imported > 0,
        imported,
        total,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Erreur lors de la vérification des réseaux:', error);
      throw error;
    }
  }
};