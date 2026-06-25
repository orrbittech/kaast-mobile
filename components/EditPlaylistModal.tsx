import { useEffect } from "react";
import { Modal, View, Pressable, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useActiveOrgContext,
  useDevices,
  usePlaylist,
  usePlaylistSchedules,
  useUpdatePlaylistWithSchedule,
} from "../lib/hooks";
import {
  formatTimeLabel,
  normalizeSchedulePriority,
} from "../lib/constants/playlist-form";
import { usePlaylistEditStore } from "../lib/stores/playlistEditStore";
import { ModalCloseButton } from "./ModalCloseButton";
import { PlaylistScheduleFormFields } from "./PlaylistScheduleFormFields";
import { Text } from "./ui/Text";

interface EditPlaylistModalProps {
  visible: boolean;
  playlistId: string | null;
  onClose: () => void;
}

export function EditPlaylistModal({
  visible,
  playlistId,
  onClose,
}: EditPlaylistModalProps) {
  const insets = useSafeAreaInsets();
  const { clerkOrgId, locations } = useActiveOrgContext();
  const { data: playlist } = usePlaylist(visible ? playlistId ?? undefined : undefined);
  const { data: schedules } = usePlaylistSchedules(
    visible ? playlistId ?? undefined : undefined,
  );
  const { data: devices } = useDevices(clerkOrgId);
  const updatePlaylistWithSchedule = useUpdatePlaylistWithSchedule(clerkOrgId);

  const name = usePlaylistEditStore((state) => state.name);
  const locationId = usePlaylistEditStore((state) => state.locationId);
  const schedule = usePlaylistEditStore((state) => state.schedule);
  const scheduleId = usePlaylistEditStore((state) => state.scheduleId);
  const errors = usePlaylistEditStore((state) => state.errors);
  const isValid = usePlaylistEditStore((state) => state.isValid);
  const isDirty = usePlaylistEditStore((state) => state.isDirty);
  const isSubmitting = usePlaylistEditStore((state) => state.isSubmitting);
  const setName = usePlaylistEditStore((state) => state.setName);
  const setLocationId = usePlaylistEditStore((state) => state.setLocationId);
  const setScheduleField = usePlaylistEditStore((state) => state.setScheduleField);
  const toggleDay = usePlaylistEditStore((state) => state.toggleDay);
  const toggleDevice = usePlaylistEditStore((state) => state.toggleDevice);
  const loadFromPlaylist = usePlaylistEditStore((state) => state.loadFromPlaylist);
  const validate = usePlaylistEditStore((state) => state.validate);
  const getDirtyPlaylistPatch = usePlaylistEditStore((state) => state.getDirtyPlaylistPatch);
  const getDirtySchedulePatch = usePlaylistEditStore((state) => state.getDirtySchedulePatch);
  const setIsSubmitting = usePlaylistEditStore((state) => state.setIsSubmitting);
  const reset = usePlaylistEditStore((state) => state.reset);

  useEffect(() => {
    if (!visible || !playlistId || !playlist) return;
    const primarySchedule = schedules?.[0];
    loadFromPlaylist({
      playlistId,
      scheduleId: primarySchedule?.id ?? null,
      name: playlist.name,
      locationId: playlist.locationId ?? null,
      schedule: primarySchedule
        ? {
            startTime: formatTimeLabel(primarySchedule.startTime),
            endTime: formatTimeLabel(primarySchedule.endTime),
            startDate: primarySchedule.startDate,
            endDate: primarySchedule.endDate ?? "",
            repeatType: primarySchedule.repeatType,
            daysOfWeek: primarySchedule.daysOfWeek ?? [],
            timezone: primarySchedule.timezone,
            priority: normalizeSchedulePriority(primarySchedule.priority),
            enabled: primarySchedule.enabled,
            loopPlaylist: primarySchedule.loopPlaylist,
            deviceTargetMode: primarySchedule.deviceTargetMode,
            deviceIds: primarySchedule.deviceIds ?? [],
          }
        : undefined,
    });
  }, [visible, playlistId, playlist, schedules, loadFromPlaylist]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectLocation = (nextLocationId: string | null) => {
    setLocationId(nextLocationId);
    const location = locations?.find((item) => item.id === nextLocationId);
    if (location?.timezone) {
      setScheduleField("timezone", location.timezone);
    }
  };

  const handleSave = async () => {
    if (!playlistId || !validate()) return;

    const playlistPatch = getDirtyPlaylistPatch();
    const schedulePatch = getDirtySchedulePatch();
    if (Object.keys(playlistPatch).length === 0 && Object.keys(schedulePatch).length === 0) {
      handleClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePlaylistWithSchedule.mutateAsync({
        playlistId,
        scheduleId,
        playlistPatch,
        schedulePatch,
      });
      reset();
      onClose();
    } catch {
      // Global NetworkErrorHandler shows error
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || updatePlaylistWithSchedule.isPending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="max-h-[92%] rounded-t-3xl bg-zinc-900 px-6 pt-6">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-sans-semibold text-white mb-1">
                Edit Playlist
              </Text>
              <Text className="text-zinc-300 text-sm">
                Update playlist details and schedule. Only changed fields are saved.
              </Text>
            </View>
            <ModalCloseButton onPress={handleClose} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-zinc-100 text-sm font-sans-medium mb-3">
              Playlist details
            </Text>

            <Text className="text-zinc-200 text-sm mb-2">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Playlist name"
              placeholderTextColor="#71717a"
              style={{ fontFamily: "Urbanist_400Regular" }}
              className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-1"
            />
            {errors.name ? (
              <Text className="text-primary text-xs mb-3">{errors.name}</Text>
            ) : (
              <View className="mb-3" />
            )}

            <Text className="text-zinc-200 text-sm mb-2">Location (optional)</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              <Pressable
                onPress={() => handleSelectLocation(null)}
                className={`px-3 py-2 rounded-lg ${
                  locationId == null ? "bg-approve" : "bg-zinc-800"
                }`}
              >
                <Text className="text-white text-sm">All locations</Text>
              </Pressable>
              {locations?.map((location) => (
                <Pressable
                  key={location.id}
                  onPress={() => handleSelectLocation(location.id)}
                  className={`px-3 py-2 rounded-lg ${
                    locationId === location.id ? "bg-approve" : "bg-zinc-800"
                  }`}
                >
                  <Text className="text-white text-sm">{location.name}</Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-zinc-100 text-sm font-sans-medium mb-1">
              Schedule
            </Text>
            <Text className="text-zinc-300 text-xs mb-4">
              {scheduleId
                ? "Changes apply to the primary schedule slot."
                : "No schedule yet — saving will create one."}
            </Text>

            <PlaylistScheduleFormFields
              form={schedule}
              errors={errors}
              devices={devices}
              onChange={setScheduleField}
              onToggleDay={toggleDay}
              onToggleDevice={toggleDevice}
            />
          </ScrollView>

          <View
            className="flex-row gap-3 mt-4"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <Pressable
              onPress={handleClose}
              className="flex-1 py-3 rounded-xl bg-primary items-center"
            >
              <Text className="font-sans-medium text-white">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSave()}
              disabled={!isValid || !isDirty || isPending}
              className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-sans-medium text-white">Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
