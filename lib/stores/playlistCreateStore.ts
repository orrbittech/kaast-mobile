import { create } from "zustand";
import {
  createPlaylistFormSchema,
  type CreatePlaylistFormValues,
  type CreatePlaylistScheduleFormValues,
} from "../api/schemas";
import type { DeviceTargetMode, RepeatType, SchedulePriority } from "../api/types";

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultScheduleFormState(): CreatePlaylistScheduleFormValues {
  return {
    startTime: "09:00",
    endTime: "17:00",
    startDate: todayDateString(),
    endDate: "",
    repeatType: "daily",
    daysOfWeek: [],
    timezone: "UTC",
    priority: "medium",
    enabled: true,
    loopPlaylist: true,
    deviceTargetMode: "all",
    deviceIds: [],
  };
}

function defaultFormState(): CreatePlaylistFormValues {
  return {
    name: "",
    locationId: null,
    schedule: defaultScheduleFormState(),
  };
}

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

type PlaylistCreateState = CreatePlaylistFormValues & {
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  setName: (name: string) => void;
  setLocationId: (locationId: string | null) => void;
  setScheduleField: <K extends keyof CreatePlaylistScheduleFormValues>(
    key: K,
    value: CreatePlaylistScheduleFormValues[K],
  ) => void;
  toggleDay: (day: number) => void;
  toggleDevice: (deviceId: string) => void;
  validate: () => boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  reset: () => void;
};

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

export const usePlaylistCreateStore = create<PlaylistCreateState>((set, get) => ({
  ...defaultFormState(),
  errors: {},
  isValid: false,
  isSubmitting: false,

  setName: (name) =>
    set((state) => {
      const next = { ...state, name };
      return { name, ...revalidate(next) };
    }),

  setLocationId: (locationId) =>
    set((state) => {
      const next = { ...state, locationId };
      return { locationId, ...revalidate(next) };
    }),

  setScheduleField: (key, value) =>
    set((state) => {
      const schedule = { ...state.schedule, [key]: value };
      const next = { ...state, schedule };
      return { schedule, ...revalidate(next) };
    }),

  toggleDay: (day) =>
    set((state) => {
      const exists = state.schedule.daysOfWeek.includes(day);
      const daysOfWeek = exists
        ? state.schedule.daysOfWeek.filter((d) => d !== day)
        : [...state.schedule.daysOfWeek, day];
      const schedule = { ...state.schedule, daysOfWeek };
      const next = { ...state, schedule };
      return { schedule, ...revalidate(next) };
    }),

  toggleDevice: (deviceId) =>
    set((state) => {
      const exists = state.schedule.deviceIds.includes(deviceId);
      const deviceIds = exists
        ? state.schedule.deviceIds.filter((id) => id !== deviceId)
        : [...state.schedule.deviceIds, deviceId];
      const schedule = { ...state.schedule, deviceIds };
      const next = { ...state, schedule };
      return { schedule, ...revalidate(next) };
    }),

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

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  reset: () =>
    set({
      ...defaultFormState(),
      errors: {},
      isValid: false,
      isSubmitting: false,
    }),
}));

export function scheduleFormToApiPayload(
  schedule: CreatePlaylistScheduleFormValues,
): {
  startTime: string;
  endTime: string;
  startDate: string;
  endDate?: string | null;
  repeatType?: RepeatType;
  daysOfWeek?: number[];
  timezone?: string;
  priority?: SchedulePriority;
  enabled?: boolean;
  loopPlaylist?: boolean;
  deviceTargetMode?: DeviceTargetMode;
  deviceIds?: string[];
} {
  return {
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    startDate: schedule.startDate,
    endDate: schedule.endDate?.trim() ? schedule.endDate.trim() : null,
    repeatType: schedule.repeatType,
    daysOfWeek:
      schedule.repeatType === "weekly" || schedule.repeatType === "custom"
        ? schedule.daysOfWeek
        : [],
    timezone: schedule.timezone,
    priority: schedule.priority,
    enabled: schedule.enabled,
    loopPlaylist: schedule.loopPlaylist,
    deviceTargetMode: schedule.deviceTargetMode,
    deviceIds:
      schedule.deviceTargetMode === "all" ? [] : schedule.deviceIds,
  };
}
