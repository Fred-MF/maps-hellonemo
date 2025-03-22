import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { networkImportService } from '../../services/networkImportService';

const NetworkImport: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
      setWarnings([]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier CSV');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setWarnings([]);

    try {
      const result = await networkImportService.importNetworks(file);
      
      setSuccess(
        `Import réussi : ${result.imported} réseau${result.imported > 1 ? 'x' : ''} importé${result.imported > 1 ? 's' : ''}`
      );

      if (result.warnings) {
        setWarnings(result.warnings);
      }
      
      setTimeout(() => navigate('/admin/networks'), 3000);
    } catch (err) {
      setError('Erreur lors de l\'import: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Import des réseaux</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Format du fichier CSV attendu
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Le fichier doit contenir les colonnes suivantes :</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>ID Réseau (identifiant unique)</li>
                    <li>Nom Réseau (nom technique)</li>
                    <li>Nom d'affichage (optionnel)</li>
                    <li>Région (nom ou identifiant)</li>
                    <li>Opérateurs (liste séparée par des virgules, optionnel)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fichier CSV
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Sélectionner un fichier</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".csv"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </label>
                  <p className="pl-1">ou glisser-déposer</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV uniquement
                </p>
              </div>
            </div>
          </div>

          {file && (
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              {file.name}
            </div>
          )}

          {error && (
            <div className="flex items-center p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-4 text-sm text-yellow-700 bg-yellow-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Info className="h-5 w-5 mr-2" />
                <span className="font-medium">Avertissements :</span>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {success && (
            <div className="flex items-center p-4 text-sm text-green-700 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Import en cours...' : 'Importer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkImport;