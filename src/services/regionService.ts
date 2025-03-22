import { supabase } from '../lib/supabase';
import { Region } from '../types/api';

export const regionService = {
  // Récupérer toutes les régions actives
  async getAllRegions(): Promise<Region[]> {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des régions:', error);
      return [];
    }
  },

  // Récupérer une région par son ID
  async getRegionById(id: string): Promise<Region | null> {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la région:', error);
      return null;
    }
  }
};