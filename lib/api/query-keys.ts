/** Centralized query keys for consistent cache invalidation */
export const userKeys = {
    me: ['user', 'me'] as const,
};

export const deviceKeys = {
    all: ['devices'] as const,
    lists: () => [...deviceKeys.all, 'list'] as const,
    list: (clerkOrgId: string) => [...deviceKeys.lists(), clerkOrgId] as const,
    details: () => [...deviceKeys.all, 'detail'] as const,
    detail: (id: string) => [...deviceKeys.details(), id] as const,
};

export const locationKeys = {
    all: ['locations'] as const,
    lists: () => [...locationKeys.all, 'list'] as const,
    list: (clerkOrgId: string) => [...locationKeys.lists(), clerkOrgId] as const,
};

export const playlistKeys = {
    all: ['playlists'] as const,
    lists: () => [...playlistKeys.all, 'list'] as const,
    list: (clerkOrgId: string) =>
        [...playlistKeys.lists(), clerkOrgId] as const,
    mediaLists: () => [...playlistKeys.all, 'media'] as const,
    mediaList: (clerkOrgId: string) =>
        [...playlistKeys.mediaLists(), clerkOrgId] as const,
    details: () => [...playlistKeys.all, 'detail'] as const,
    detail: (id: string) => [...playlistKeys.details(), id] as const,
};

export const mediaSessionKeys = {
    all: ['mediaSession'] as const,
    detail: (deviceId: string) =>
        [...mediaSessionKeys.all, deviceId] as const,
};
