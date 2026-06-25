export const ORG_PLAN_SLUGS = {
  starter: 'org:starter',
  growth: 'org:growth',
  scale: 'org:scale',
} as const;

export type OrgPlanSlug = (typeof ORG_PLAN_SLUGS)[keyof typeof ORG_PLAN_SLUGS];

export const PLAN_FEATURE_SLUGS = [
  'media_library',
  'devices',
  'playlists',
  'schedules',
  'uploads',
  'analytics',
] as const;

export type PlanFeatureSlug = (typeof PLAN_FEATURE_SLUGS)[number];

export type PlanLimits = {
  maxDevices: number | null;
  maxPlaylists: number | null;
  maxLocations: number | null;
};

export type PlanFeatureFlags = Record<PlanFeatureSlug, boolean>;

export type PlanDefinition = {
  slug: OrgPlanSlug;
  name: string;
  limits: PlanLimits;
  features: PlanFeatureFlags;
  marketingFeatures: string[];
};

export const PLAN_DEFINITIONS: Record<OrgPlanSlug, PlanDefinition> = {
  [ORG_PLAN_SLUGS.starter]: {
    slug: ORG_PLAN_SLUGS.starter,
    name: 'Starter',
    limits: { maxDevices: 3, maxPlaylists: 5, maxLocations: 1 },
    features: {
      media_library: true,
      devices: true,
      playlists: true,
      schedules: true,
      uploads: false,
      analytics: false,
    },
    marketingFeatures: [
      'Up to 3 TV screens',
      'Media library',
      'Up to 5 playlists',
      'Basic scheduling',
      '1 store location',
    ],
  },
  [ORG_PLAN_SLUGS.growth]: {
    slug: ORG_PLAN_SLUGS.growth,
    name: 'Growth',
    limits: { maxDevices: 10, maxPlaylists: 25, maxLocations: 5 },
    features: {
      media_library: true,
      devices: true,
      playlists: true,
      schedules: true,
      uploads: true,
      analytics: false,
    },
    marketingFeatures: [
      'Up to 10 TV screens',
      'Everything in Starter',
      'File uploads (video, image, audio)',
      'Up to 25 playlists',
      'Advanced scheduling',
      'Up to 5 store locations',
    ],
  },
  [ORG_PLAN_SLUGS.scale]: {
    slug: ORG_PLAN_SLUGS.scale,
    name: 'Scale',
    limits: { maxDevices: null, maxPlaylists: null, maxLocations: null },
    features: {
      media_library: true,
      devices: true,
      playlists: true,
      schedules: true,
      uploads: true,
      analytics: true,
    },
    marketingFeatures: [
      'Unlimited TV screens',
      'Everything in Growth',
      'Analytics & playback reports',
      'Unlimited playlists & locations',
      'Priority support',
    ],
  },
};

const DEFAULT_PLAN_SLUG = ORG_PLAN_SLUGS.starter;

export function isOrgPlanSlug(slug: string | null | undefined): slug is OrgPlanSlug {
  if (!slug) return false;
  return slug in PLAN_DEFINITIONS;
}

export function getPlanDefinition(
  planSlug: string | null | undefined,
): PlanDefinition {
  if (isOrgPlanSlug(planSlug)) {
    return PLAN_DEFINITIONS[planSlug];
  }
  return PLAN_DEFINITIONS[DEFAULT_PLAN_SLUG];
}

export function getPlanLimits(planSlug: string | null | undefined): PlanLimits {
  return getPlanDefinition(planSlug).limits;
}

export function getPlanFeatureFlags(
  planSlug: string | null | undefined,
): PlanFeatureFlags {
  return getPlanDefinition(planSlug).features;
}

export function planHasFeature(
  planSlug: string | null | undefined,
  feature: PlanFeatureSlug,
): boolean {
  return getPlanFeatureFlags(planSlug)[feature];
}

export function isAtDeviceLimit(
  planSlug: string | null | undefined,
  currentCount: number,
): boolean {
  const { maxDevices } = getPlanLimits(planSlug);
  if (maxDevices === null) return false;
  return currentCount >= maxDevices;
}
