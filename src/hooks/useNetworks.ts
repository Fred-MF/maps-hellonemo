import { useQuery, useMutation, useQueryClient } from 'react-query';
import { networkService } from '../services/networkService';

export function useNetworks() {
  const queryClient = useQueryClient();

  const { data: networks, isLoading, error } = useQuery(
    'networks',
    networkService.getAllNetworks
  );

  const updateNetwork = useMutation(
    ({ id, updates }: { id: string; updates: any }) =>
      networkService.updateNetwork(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('networks');
      },
    }
  );

  const createNetwork = useMutation(
    (network: any) => networkService.createNetwork(network),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('networks');
      },
    }
  );

  const checkAvailability = useMutation(
    ({ networkId, isAvailable, errorMessage }: { networkId: string; isAvailable: boolean; errorMessage?: string }) =>
      networkService.checkNetworkAvailability(networkId, isAvailable, errorMessage),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('networks');
      },
    }
  );

  return {
    networks,
    isLoading,
    error,
    updateNetwork,
    createNetwork,
    checkAvailability,
  };
}

export function useNetworkHistory(networkId: string) {
  return useQuery(
    ['networkHistory', networkId],
    () => networkService.getNetworkStatusHistory(networkId)
  );
}