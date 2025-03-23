import { supabase } from '../lib/supabase';
import { createApiClient } from './api';
import { regions } from '../data/regions';

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

          // Pour chaque agence, créer ou mettre à jour le réseau correspondant
          for (const agency of agencies) {
            try {
              const networkId = `${region.id}:${agency.gtfsId}`;
              processedNetworkIds.add(networkId);

              // Créer ou mettre à jour le réseau
              const { data: network, error: networkError } = await supabase
                .from('networks')
                .upsert({
                  id: networkId,
                  name: agency.name,
                  gtfs_id: agency.gtfsId,
                  feed_id: feed.feedId,
                  region_id: region.id,
                  is_available: true,
                  last_check: new Date().toISOString(),
                  error_message: null
                })
                .select()
                .single();

              if (networkError) throw networkError;
              if (network) imported++;

              // Créer ou mettre à jour l'opérateur
              const { error: operatorError } = await supabase
                .from('operators')
                .upsert({
                  network_id: networkId,
                  name: agency.name,
                  gtfs_id: agency.gtfsId,
                  feed_id: feed.feedId,
                  is_active: true
                }, {
                  onConflict: 'network_id,gtfs_id'
                });

              if (operatorError) throw operatorError;

            } catch (error) {
              console.error('Erreur lors du traitement du réseau:', error);
              errors.push(`Erreur pour le réseau ${agency.name}: ${error.message}`);
            }
          }
        } catch (error) {
          console.error('Erreur lors du traitement du feed:', error);
          errors.push(`Erreur pour le feed ${feed.feedId}: ${error.message}`);
        }
      }

      // Marquer comme indisponibles les réseaux qui n'ont pas été trouvés dans l'API
      if (processedNetworkIds.size > 0) {
        const { error: updateError } = await supabase
          .from('networks')
          .update({
            is_available: false,
            last_check: new Date().toISOString(),
            error_message: 'Réseau non trouvé lors de la dernière vérification'
          })
          .eq('region_id', region.id)
          .not('id', 'in', `(${Array.from(processedNetworkIds).map(id => `'${id}'`).join(',')})`);

        if (updateError) {
          console.error('Erreur lors de la mise à jour des réseaux inactifs:', updateError);
          errors.push(`Erreur lors de la désactivation des réseaux: ${updateError.message}`);
        }

        // Désactiver les opérateurs des réseaux non trouvés
        const { error: operatorUpdateError } = await supabase
          .from('operators')
          .update({ is_active: false })
          .eq('network_id', 'in', (
            supabase
              .from('networks')
              .select('id')
              .eq('region_id', region.id)
              .eq('is_available', false)
          ));

        if (operatorUpdateError) {
          console.error('Erreur lors de la mise à jour des opérateurs inactifs:', operatorUpdateError);
          errors.push(`Erreur lors de la désactivation des opérateurs: ${operatorUpdateError.message}`);
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