import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { networkService } from '../../services/networkService';
import { Network, Save, ArrowLeft, Trash2, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { regions } from '../../data/regions';

const NetworkEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const { data: network, isLoading } = useQuery(
    ['network', id],
    () => networkService.getNetworkById(id!),
    {
      enabled: !!id && !isNew
    }
  );

  const [formData, setFormData] = useState({
    name: network?.name || '',
    display_name: network?.display_name || '',
    gtfs_id: network?.gtfs_id || '',
    feed_id: network?.feed_id || '',
    region_id: network?.region_id || '',
    is_available: network?.is_available ?? true
  });

  // Mettre à jour le formulaire quand les données du réseau sont chargées
  useEffect(() => {
    if (network) {
      setFormData({
        name: network.name,
        display_name: network.display_name || '',
        gtfs_id: network.gtfs_id,
        feed_id: network.feed_id,
        region_id: network.region_id,
        is_available: network.is_available
      });
    }
  }, [network]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNew) {
        await networkService.createNetwork(formData);
      } else {
        await networkService.updateNetwork(id!, formData);
      }
      navigate('/admin/networks');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce réseau ?')) {
      return;
    }

    try {
      await networkService.deleteNetwork(id!);
      navigate('/admin/networks');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex justify-center items-center h-64">
        <Network className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/networks')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Nouveau réseau' : 'Éditer le réseau'}
          </h1>
        </div>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nom technique
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
              Nom d'affichage
            </label>
            <input
              type="text"
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
              Région
            </label>
            <select
              id="region"
              value={formData.region_id}
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Sélectionner une région</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gtfs_id" className="block text-sm font-medium text-gray-700">
              GTFS ID
            </label>
            <input
              type="text"
              id="gtfs_id"
              value={formData.gtfs_id}
              onChange={(e) => setFormData({ ...formData, gtfs_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="feed_id" className="block text-sm font-medium text-gray-700">
              Feed ID
            </label>
            <input
              type="text"
              id="feed_id"
              value={formData.feed_id}
              onChange={(e) => setFormData({ ...formData, feed_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_available"
            checked={formData.is_available}
            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">
            Réseau actif
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="mr-2 h-4 w-4" />
            {isNew ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NetworkEdit;