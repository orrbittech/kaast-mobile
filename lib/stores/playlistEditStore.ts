import { create } from "zustand";
import {
  createPlaylistFormSchema,
  type CreatePlaylistFormValues,
  type CreatePlaylistScheduleFormValues,
} from "../api/schemas";
import {
  defaultScheduleFormState,
  scheduleFormToApiPayload,
} from "./playlistCreateStore";
import { diffPartial, hasChanges } from "../utils/diffPartial";
import { normalizeSchedulePriority } from "../constants/playlist-form";

function zodIssuesToErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

function parseForm(state: CreatePlaylistFormValues) {
  const schedulePayload = {
    ...state.schedule,
    endDate: state.schedule.endDate?.trim() ? state.schedule.endDate.trim() : undefined,
    daysOfWeek:
      state.schedule.repeatType === "weekly" || state.schedule.repeatType === "custom"
        ? state.schedule.daysOfWeek
        : [],
    deviceIds:
      state.schedule.deviceTargetMode === "all" ? [] : state.schedule.deviceIds,
  };

  return createPlaylistFormSchema.safeParse({
    name: state.name,
    locationId: state.locationId,
    schedule: schedulePayload,
  });
}

function revalidate(state: CreatePlaylistFormValues) {
  const result = parseForm(state);
  return {
    isValid: result.success,
    errors: result.success ? {} : zodIssuesToErrors(result.error.issues),
  };
}

type PlaylistEditState = CreatePlaylistFormValues & {
  playlistId: string | null;
  scheduleId: string | null;
  initial: CreatePlaylistFormValues | null;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  setName: (name: string) => void;
  setLocationId: (locationId: string | null) => void;
  setScheduleField: <K extends keyof CreatePlaylistScheduleFormValues>(
    key: K,
    value: CreatePlaylistScheduleFormValues[K],
  ) => void;
  toggleDay: (day: number) => void;
  toggleDevice: (deviceId: string) => void;
  loadFromPlaylist: (input: {
    playlistId: string;
    scheduleId: string | null;
    name: string;
    locationId?: string | null;
    schedule?: Partial<CreatePlaylistScheduleFormValues>;
  }) => void;
  validate: () => boolean;
  getDirtyPlaylistPatch: () => { name?: string; locationId?: string | null };
  getDirtySchedulePatch: () => Partial<ReturnType<typeof scheduleFormToApiPayload>>;
  setIsSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;
};

export const usePlaylistEditStore = create<PlaylistEditState>((set, get) => ({
  name: "",
  locationId: null,
  schedule: defaultScheduleFormState(),
  playlistId: null,
  scheduleId: null,
  initial: null,
  errors: {},
  isValid: false,
  isSubmitting: false,
  isDirty: false,

  setName: (name) =>
    set((state) => {
      const next = { ...state, name };
      const validation = revalidate(next);
      return {
        name,
        ...validation,
        isDirty: state.initial ? hasChanges(state.initial, next) : false,
      };
    }),

  setLocationId: (locationId) =>
    set((state) => {
      const next = { ...state, locationId };
      const validation = revalidate(next);
      return {
        locationId,
        ...validation,
        isDirty: state.initial ? hasChanges(state.initial, next) : false,
      };
    }),

  setScheduleField: (key, value) =>
    set((state) => {
      const schedule = { ...state.schedule, [key]: value };
      const next = { ...state, schedule };
      const validation = revalidate(next);
      return {
        schedule,
        ...validation,
        isDirty: state.initial ? hasChanges(state.initial, next) : false,
      };
    }),

  toggleDay: (day) =>
    set((state) => {
      const exists = state.schedule.daysOfWeek.includes(day);
      const daysOfWeek = exists
        ? state.schedule.daysOfWeek.filter((d) => d !== day)
        : [...state.schedule.daysOfWeek, day];
      const schedule = { ...state.schedule, daysOfWeek };
      const next = { ...state, schedule };
      const validation = revalidate(next);
      return {
        schedule,
        ...validation,
        isDirty: state.initial ? hasChanges(state.initial, next) : false,
      };
    }),

  toggleDevice: (deviceId) =>
    set((state) => {
      const exists = state.schedule.deviceIds.includes(deviceId);
      const deviceIds = exists
        ? state.schedule.deviceIds.filter((id) => id !== deviceId)
        : [...state.schedule.deviceIds, deviceId];
      const schedule = { ...state.schedule, deviceIds };
      const next = { ...state, schedule };
      const validation = revalidate(next);
      return {
        schedule,
        ...validation,
        isDirty: state.initial ? hasChanges(state.initial, next) : false,
      };
    }),

  loadFromPlaylist: ({ playlistId, scheduleId, name, locationId, schedule }) => {
    const values: CreatePlaylistFormValues = {
      name,
      locationId: locationId ?? null,
      schedule: {
        ...defaultScheduleFormState(),
        ...schedule,
        priority: normalizeSchedulePriority(schedule?.priority ?? "medium"),
      },
    };
    const validation = revalidate(values);
    set({
      ...values,
      playlistId,
      scheduleId,
      initial: values,
      isDirty: false,
      isSubmitting: false,
      ...validation,
    });
  },

  validate: () => {
    const state = get();
    const result = parseForm(state);
    if (result.success) {
      set({ errors: {}, isValid: true });
      return true;
    }
    set({
      errors: zodIssuesToErrors(result.error.issues),
      isValid: false,
    });
    return false;
  },

  getDirtyPlaylistPatch: () => {
    const { initial, name, locationId } = get();
    if (!initial) return {};
    return diffPartial(
      { name: initial.name, locationId: initial.locationId ?? null },
      { name, locationId: locationId ?? null },
    );
  },

  getDirtySchedulePatch: () => {
    const { initial, schedule } = get();
    if (!initial) return {};
    const initialPayload = scheduleFormToApiPayload(initial.schedule);
    const currentPayload = scheduleFormToApiPayload(schedule);
    return diffPartial(
      initialPayload as Record<string, unknown>,
      currentPayload as Record<string, unknown>,
    ) as Partial<ReturnType<typeof scheduleFormToApiPayload>>;
  },

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  reset: () =>
    set({
      name: "",
      locationId: null,
      schedule: defaultScheduleFormState(),
      playlistId: null,
      scheduleId: null,
      initial: null,
      errors: {},
      isValid: false,
      isSubmitting: false,
      isDirty: false,
    }),
}));
