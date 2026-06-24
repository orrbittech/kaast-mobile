import { useQuery } from '@tanstack/react-query';
import { usersApi, type UserProfile } from '../api';

export type { UserProfile };

export function useUserProfile() {
    return useQuery({
        queryKey: ['user', 'me'],
        queryFn: () => usersApi.getMe(),
    });
}
