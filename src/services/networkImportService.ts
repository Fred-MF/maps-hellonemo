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
      const processedOperatorIds = new Set<string>();

      // Pour chaque feed, récupérer et traiter les agences
      for (const feed of feeds) {
        try {
          // Utilisation du client API corrigé qui retourne directement un tableau d'agences
          const agencies = await apiClient.getAgenciesByFeed(feed.feedId);
          total += agencies.length;
          console.log(`Traitement du feed ${feed.feedId} avec ${agencies.length} agences`);

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

          if (networkError) {
            console.error('Erreur lors de la création/mise à jour du réseau:', networkError);
            errors.push(`Erreur pour le réseau ${networkId}: ${networkError.message}`);
            continue; // Passer au feed suivant si erreur réseau
          }

          // Pour chaque agence, créer ou mettre à jour l'opérateur
          for (const agency of agencies) {
            try {
              // Vérifier que l'agence a les champs nécessaires
              if (!agency.gtfsId) {
                console.warn(`Agence sans gtfsId, utilisation de l'ID à la place:`, agency);
                agency.gtfsId = agency.id; // Utiliser l'ID si gtfsId est absent
              }

              // Créer ou mettre à jour l'opérateur
              const { data: operator, error: operatorError } = await supabase
                .from('operators')
                .upsert({
                  network_id: networkId,
                  agency_id: agency.id || `unknown_${Date.now()}`,
                  name: agency.name || 'Opérateur sans nom',
                  display_name: agency.name || 'Opérateur sans nom',
                  gtfs_id: agency.gtfsId,
                  is_active: true
                }, {
                  onConflict: 'network_id,gtfs_id'
                })
                .select('id')
                .single();

              if (operatorError) {
                console.error('Erreur lors de la création/mise à jour de l\'opérateur:', operatorError);
                errors.push(`Erreur pour l'agence ${agency.name || 'sans nom'}: ${operatorError.message}`);
                continue;
              }
              
              if (operator) {
                processedOperatorIds.add(operator.id);
                imported++;
              }
            } catch (error) {
              console.error('Erreur lors du traitement de l\'agence:', error);
              errors.push(`Erreur pour l'agence ${agency.name || 'sans nom'}: ${error.message}`);
            }
          }
        } catch (error) {
          console.error('Erreur lors du traitement du feed:', error);
          errors.push(`Erreur pour le feed ${feed.feedId}: ${error.message}`);
        }
      }

      // Désactiver les opérateurs qui n'ont pas été trouvés dans l'API
      if (processedOperatorIds.size > 0) {
        const operatorIds = Array.from(processedOperatorIds);
        const networkIds = Array.from(processedNetworkIds);

        console.log(`Désactivation des opérateurs non trouvés. ${operatorIds.length} opérateurs actifs, ${networkIds.length} réseaux traités`);

        // Approche améliorée: désactiver les opérateurs réseau par réseau
        for (const networkId of networkIds) {
          const { error: updateOperatorsError } = await supabase
            .from('operators')
            .update({ is_active: false })
            .eq('network_id', networkId)
            .not('id', 'in', operatorIds);

          if (updateOperatorsError) {
            console.error(`Erreur lors de la désactivation des opérateurs pour le réseau ${networkId}:`, updateOperatorsError);
            errors.push(`Erreur lors de la désactivation des opérateurs pour le réseau ${networkId}: ${updateOperatorsError.message}`);
          }
        }
      }

      // Marquer comme indisponibles les réseaux qui n'ont pas été trouvés dans l'API
      if (processedNetworkIds.size > 0) {
        const networkIds = Array.from(processedNetworkIds);
        
        console.log(`Désactivation des réseaux non trouvés pour la région ${region.id}. ${networkIds.length} réseaux traités`);
        
        const { error: updateNetworksError } = await supabase
          .from('networks')
          .update({
            is_available: false,
            last_check: new Date().toISOString(),
            error_message: 'Réseau non trouvé lors de la dernière vérification'
          })
          .eq('region_id', region.id)
          .not('id', 'in', networkIds);

        if (updateNetworksError) {
          console.error('Erreur lors de la mise à jour des réseaux inactifs:', updateNetworksError);
          errors.push(`Erreur lors de la désactivation des réseaux: ${updateNetworksError.message}`);
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