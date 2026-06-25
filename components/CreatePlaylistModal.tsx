import { Modal, View, Pressable, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useActiveOrgContext,
  useCreatePlaylistWithSchedule,
  useDevices,
} from "../lib/hooks";
import {
  scheduleFormToApiPayload,
  usePlaylistCreateStore,
} from "../lib/stores/playlistCreateStore";
import { ModalCloseButton } from "./ModalCloseButton";
import { PlaylistScheduleFormFields } from "./PlaylistScheduleFormFields";
import { Text } from "./ui/Text";

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreatePlaylistModal({ visible, onClose }: CreatePlaylistModalProps) {
  const insets = useSafeAreaInsets();
  const { clerkOrgId, locations } = useActiveOrgContext();
  const { data: devices } = useDevices(clerkOrgId);
  const createPlaylistWithSchedule = useCreatePlaylistWithSchedule(clerkOrgId);

  const name = usePlaylistCreateStore((state) => state.name);
  const locationId = usePlaylistCreateStore((state) => state.locationId);
  const schedule = usePlaylistCreateStore((state) => state.schedule);
  const errors = usePlaylistCreateStore((state) => state.errors);
  const isValid = usePlaylistCreateStore((state) => state.isValid);
  const isSubmitting = usePlaylistCreateStore((state) => state.isSubmitting);
  const setName = usePlaylistCreateStore((state) => state.setName);
  const setLocationId = usePlaylistCreateStore((state) => state.setLocationId);
  const setScheduleField = usePlaylistCreateStore((state) => state.setScheduleField);
  const toggleDay = usePlaylistCreateStore((state) => state.toggleDay);
  const toggleDevice = usePlaylistCreateStore((state) => state.toggleDevice);
  const validate = usePlaylistCreateStore((state) => state.validate);
  const setIsSubmitting = usePlaylistCreateStore((state) => state.setIsSubmitting);
  const reset = usePlaylistCreateStore((state) => state.reset);

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

  const handleCreate = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createPlaylistWithSchedule.mutateAsync({
        name: name.trim(),
        locationId: locationId ?? null,
        schedule: scheduleFormToApiPayload(schedule),
      });
      reset();
      onClose();
    } catch {
      // Global NetworkErrorHandler shows error
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || createPlaylistWithSchedule.isPending;

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
                Create Playlist
              </Text>
              <Text className="text-zinc-300 text-sm">
                Add playlist details and when it should play on your devices.
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
              placeholder="e.g. Lobby Display"
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
              Required. Define when this playlist should play.
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
              onPress={() => void handleCreate()}
              disabled={!isValid || isPending}
              className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="font-sans-medium text-white">Create</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
