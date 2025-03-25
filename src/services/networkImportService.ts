import { supabase } from '../lib/supabase';
import Papa from 'papaparse';

export const networkImportService = {
  async importNetworks(file: File) {
    try {
      // Parse CSV file
      const results = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        });
      });

      if (!results.data || results.data.length === 0) {
        throw new Error('Le fichier CSV est vide');
      }

      let imported = 0;
      const warnings: string[] = [];
      const total = results.data.length;

      // Process each row
      for (const row of results.data) {
        try {
          // Extract network data from the CSV columns
          const networkId = row['networks/id'];
          const feedId = row['networks/feed_id'];
          const displayName = row['networks/display_name'];
          const regionId = row['networks/region_id'];
          const isAvailable = row['networks/is_available'] === 'TRUE';
          
          // Extract operator data
          const operatorId = row['operators/id'];
          const agencyId = row['operators/agency_id'];
          const operatorName = row['operators/name'];
          const operatorDisplayName = row['operators/display_name'];
          const operatorGtfsId = row['operators/gtfs_id'];
          const operatorIsActive = row['operators/is_active'] === 'TRUE';

          // Validate required fields
          if (!networkId || !feedId || !regionId || !operatorName || !operatorGtfsId) {
            warnings.push(`Ligne ignorée: champs requis manquants pour l'opérateur ${operatorName || 'sans nom'}`);
            continue;
          }

          // Create or update the network
          const { data: network, error: networkError } = await supabase
            .from('networks')
            .upsert({
              id: networkId,
              feed_id: feedId,
              display_name: displayName,
              region_id: regionId,
              is_available: isAvailable
            })
            .select()
            .single();

          if (networkError) {
            warnings.push(`Erreur lors de la création du réseau ${displayName || networkId}: ${networkError.message}`);
            continue;
          }

          // Create or update the operator
          const { error: operatorError } = await supabase
            .from('operators')
            .upsert({
              id: operatorId, // Use the UUID from CSV
              network_id: networkId,
              agency_id: agencyId,
              name: operatorName,
              display_name: operatorDisplayName,
              gtfs_id: operatorGtfsId,
              is_active: operatorIsActive
            });

          if (operatorError) {
            warnings.push(`Erreur lors de la création de l'opérateur ${operatorName}: ${operatorError.message}`);
            continue;
          }

          imported++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          warnings.push(`Erreur lors du traitement de la ligne: ${errorMessage}`);
        }
      }

      return {
        success: imported > 0,
        imported,
        total,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'import: ${errorMessage}`);
    }
  }
};