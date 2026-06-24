/** User profile from GET /users/me */
export interface UserProfile {
    id: string;
    clerkUserId: string;
    email?: string;
    name?: string;
    imageUrl?: string;
}

/** Resolved user for display (avatar + name) */
export interface UserSummary {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    imageUrl?: string | null;
}

/** Location from locations API */
export interface Location {
    id: string;
    name: string;
    address?: string;
    timezone?: string;
}

/** Device from devices API */
export interface Device {
    id: string;
    deviceId: string;
    name: string;
    status: string;
    locationId?: string;
    activePlaylistId?: string | null;
    clerkUserId?: string | null;
    lastSeenAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

/** Device with media session from GET /devices/:id */
export interface DeviceWithMediaSession extends Device {
    creator?: UserSummary | null;
    approver?: UserSummary | null;
    mediaSession?: {
        mediaUrl?: string | null;
        position: number;
        duration: number;
        playing: boolean;
        volume?: number | null;
        snapshotData?: string | null;
        updatedAt?: string;
    } | null;
    activePlaylist?: { id: string; name: string } | null;
}

/** Response from POST /devices/pair */
export interface PairDeviceResponse {
    paired: boolean;
    device: Device;
}

/** Media session from GET /media/sessions/:deviceId */
export interface MediaSession {
    deviceId: string;
    mediaUrl?: string | null;
    position: number;
    duration: number;
    playing: boolean;
    volume?: number | null;
    snapshotData?: string | null;
    updatedAt?: string;
}

/** Org media library item from /media/library */
export interface MediaLibraryItem {
    id: string;
    clerkUserId: string;
    clerkOrgId?: string | null;
    title: string;
    url: string;
    duration?: number | null;
    mimeType?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

/** Create media library item request body */
export interface CreateMediaLibraryItem {
    url: string;
    title?: string;
    duration?: number | null;
    mimeType?: string | null;
}

/** Update media library item request body */
export interface UpdateMediaLibraryItem {
    url?: string;
    title?: string;
    duration?: number | null;
    mimeType?: string | null;
}

/** Create device request body */
export interface CreateDevice {
    name: string;
    deviceId: string;
}

/** Pair device request body. Code-only; deviceId resolved from cache. Org from token. */
export interface PairDevice {
    code: string;
    locationId?: string;
}

/** Response from POST /devices/pairing-code */
export interface GeneratePairingCodeResponse {
    code: string;
}

/** Media command request body */
export interface MediaCommand {
    deviceId: string;
    command: 'play' | 'pause' | 'seek' | 'volume' | 'playPlaylist';
    payload?: { playlistId?: string } & Record<string, unknown>;
}

/** Playlist from playlists API */
export interface Playlist {
    id: string;
    name: string;
    locationId?: string | null;
    clerkOrgId?: string;
    createdAt?: string;
    updatedAt?: string;
    items?: PlaylistItem[];
}

/** Playlist item from playlists API */
export interface PlaylistItem {
    id: string;
    playlistId: string;
    mediaUrl: string;
    title?: string | null;
    duration?: number | null;
    order: number;
    createdAt?: string;
}

/** Create playlist request body */
export interface CreatePlaylist {
    name: string;
}

/** Update playlist request body */
export interface UpdatePlaylist {
    name?: string;
}

/** Create playlist item request body */
export interface CreatePlaylistItem {
    mediaUrl: string;
    title?: string | null;
    duration?: number | null;
    order?: number;
    mediaId?: string | null;
}

/** Update playlist item request body */
export interface UpdatePlaylistItem {
    mediaUrl?: string;
    title?: string | null;
    duration?: number | null;
    order?: number;
    mediaId?: string | null;
}

export type PlaylistDeviceAssignmentSource = 'manual' | 'schedule' | 'both';

/** Device linked to a playlist via manual assign or schedule */
export interface PlaylistAssignedDevice {
    id: string;
    name: string;
    status: string;
    locationId: string | null;
    assignmentSource: PlaylistDeviceAssignmentSource;
    isPlaying: boolean;
}

export type RepeatType = 'none' | 'daily' | 'weekly' | 'custom';
export type DeviceTargetMode = 'all' | 'include' | 'exclude';

/** Playlist schedule slot from API */
export interface PlaylistSchedule {
    id: string;
    playlistId: string;
    startTime: string;
    endTime: string;
    startDate: string;
    endDate: string | null;
    repeatType: RepeatType;
    daysOfWeek: number[];
    timezone: string;
    priority: number;
    enabled: boolean;
    loopPlaylist: boolean;
    deviceTargetMode: DeviceTargetMode;
    deviceIds: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreatePlaylistSchedule {
    startTime: string;
    endTime: string;
    startDate: string;
    endDate?: string | null;
    repeatType?: RepeatType;
    daysOfWeek?: number[];
    timezone?: string;
    priority?: number;
    enabled?: boolean;
    loopPlaylist?: boolean;
    deviceTargetMode?: DeviceTargetMode;
    deviceIds?: string[];
}

export interface UpdatePlaylistSchedule extends Partial<CreatePlaylistSchedule> {}

export interface SetPlaylistScheduleDevices {
    deviceIds: string[];
}

/** Create location request body */
export interface CreateLocation {
    name: string;
    address?: string | null;
    timezone?: string;
}

/** Update location request body */
export interface UpdateLocation {
    name?: string;
    address?: string | null;
    timezone?: string;
}
