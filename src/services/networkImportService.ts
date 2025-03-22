import { supabase } from '../lib/supabase';
import { Network } from '../types/api';
import Papa from 'papaparse';
import { regions } from '../data/regions';

// Fonction utilitaire pour normaliser les chaînes de caractères
const normalizeString = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9]/g, ''); // Garder uniquement les lettres et chiffres
};

// Table de correspondance des noms de régions
const regionAliases: { [key: string]: string } = {
  'paca': 'provence alpes cote dazur',
  'idf': 'ile de france',
  'ara': 'auvergne rhone alpes',
  'bfc': 'bourgogne franche comte',
  'bre': 'bretagne',
  'cvl': 'centre val de loire',
  'ges': 'grand est',
  'hdf': 'hauts de france',
  'nor': 'normandie',
  'naq': 'nouvelle aquitaine',
  'occ': 'occitanie',
  'pdl': 'pays de la loire',
};

export const networkImportService = {
  // Import networks from CSV data
  async importNetworks(csvFile: File) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const networks = [];
            const errors = [];
            const warnings = [];
            const processedNetworks = new Set();

            // Vérifier la structure du CSV
            const requiredColumns = ['networks/id', 'networks/name', 'networks/region_id'];
            const missingColumns = requiredColumns.filter(col => !results.meta.fields?.includes(col));
            
            if (missingColumns.length > 0) {
              throw new Error(`Colonnes manquantes dans le fichier CSV : ${missingColumns.join(', ')}`);
            }

            // Traiter chaque ligne
            for (const row of results.data) {
              try {
                // Vérifier les champs obligatoires
                if (!row['networks/id'] || !row['networks/name'] || !row['networks/region_id']) {
                  errors.push(`Ligne invalide - données obligatoires manquantes : ${JSON.stringify(row)}`);
                  continue;
                }

                // Normaliser le nom de la région
                const normalizedInput = normalizeString(row['networks/region_id']);
                const region = regions.find(r => {
                  const normalizedName = normalizeString(r.name);
                  const normalizedAlias = regionAliases[r.id] ? normalizeString(regionAliases[r.id]) : '';
                  
                  return normalizedName.includes(normalizedInput) || 
                         normalizedInput.includes(normalizedName) ||
                         (normalizedAlias && normalizedAlias.includes(normalizedInput)) ||
                         (normalizedAlias && normalizedInput.includes(normalizedAlias)) ||
                         normalizedInput === r.id;
                });

                if (!region) {
                  errors.push(`Région non reconnue : "${row['networks/region_id']}" pour le réseau ${row['networks/name']}`);
                  continue;
                }

                // Construire l'ID du réseau
                const networkId = `${region.id}:${row['networks/id']}`;
                const gtfsId = `${region.id}:${normalizeString(row['networks/name'])}`;

                // Convertir la valeur is_available en booléen
                const isAvailable = row['networks/is_available']?.toLowerCase();
                const isAvailableBoolean = isAvailable === 'true' || isAvailable === '1' || isAvailable === 'yes';

                try {
                  // Créer ou mettre à jour le réseau
                  const { data: network, error: networkError } = await supabase
                    .from('networks')
                    .upsert({
                      id: networkId,
                      name: row['networks/name'],
                      display_name: row['networks/display_name'] || null,
                      gtfs_id: gtfsId,
                      feed_id: row['networks/feed_id'] || 'default',
                      region_id: region.id,
                      is_available: isAvailableBoolean,
                      last_check: new Date().toISOString()
                    })
                    .select()
                    .single();

                  if (networkError) throw networkError;
                  
                  if (!network) {
                    throw new Error('Erreur lors de la création du réseau');
                  }

                  processedNetworks.add(networkId);

                  // Créer ou mettre à jour les opérateurs si spécifiés
                  if (row['operators/name']) {
                    const operators = row['operators/name'].split(';').map(op => op.trim());
                    
                    // Désactiver tous les opérateurs existants du réseau
                    await supabase
                      .from('operators')
                      .update({ is_active: false })
                      .eq('network_id', networkId);

                    // Créer ou réactiver les opérateurs
                    for (const operatorName of operators) {
                      if (!operatorName) continue; // Ignorer les noms vides

                      const operatorGtfsId = `${networkId}:${normalizeString(operatorName)}`;
                      
                      // Utiliser upsert avec onConflict pour gérer les doublons
                      const { error: operatorError } = await supabase
                        .from('operators')
                        .upsert({
                          network_id: networkId,
                          name: operatorName,
                          gtfs_id: operatorGtfsId,
                          feed_id: row['operators/feed_id'] || 'default',
                          is_active: true
                        }, {
                          onConflict: 'network_id,gtfs_id',
                          ignoreDuplicates: false
                        });

                      if (operatorError) {
                        warnings.push(`Erreur lors de la création de l'opérateur ${operatorName} : ${operatorError.message}`);
                      }
                    }
                  }

                } catch (error) {
                  errors.push(`Erreur lors du traitement du réseau ${row['networks/name']} : ${error.message}`);
                }

              } catch (error) {
                errors.push(`Erreur lors du traitement de la ligne : ${error.message}`);
              }
            }

            // Marquer les réseaux non présents comme indisponibles
            if (processedNetworks.size > 0) {
              const networkIds = Array.from(processedNetworks);
              const { error: updateNetworksError } = await supabase
                .from('networks')
                .update({ 
                  is_available: false,
                  error_message: 'Réseau non présent dans le dernier import',
                  last_check: new Date().toISOString()
                })
                .filter('id', 'not.in', `(${networkIds.map(id => `'${id}'`).join(',')})`);

              if (updateNetworksError) {
                warnings.push(`Erreur lors de la mise à jour des anciens réseaux: ${updateNetworksError.message}`);
              }
            }

            resolve({
              success: processedNetworks.size > 0,
              imported: processedNetworks.size,
              networks: processedNetworks.size,
              warnings: warnings.length > 0 ? warnings : null,
              errors: errors.length > 0 ? errors : null
            });

          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(new Error(`Erreur lors de la lecture du fichier CSV : ${error.message}`))
      });
    });
  }
};