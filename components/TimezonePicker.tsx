import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  filterTimezoneOptions,
  getTimezoneLabel,
  getTimezoneOptions,
} from "../lib/constants/timezones";
import { Text } from "./ui/Text";

interface TimezonePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function TimezonePicker({
  label = "Timezone",
  value,
  onChange,
}: TimezonePickerProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const options = useMemo(() => getTimezoneOptions(), []);
  const filteredOptions = useMemo(
    () => (search.trim() ? filterTimezoneOptions(search) : options),
    [options, search],
  );
  const displayLabel = value ? getTimezoneLabel(value) : "Select timezone";

  const handleClose = () => {
    setVisible(false);
    setSearch("");
  };

  return (
    <View className="mb-4">
      <Text className="text-zinc-200 text-sm mb-2">{label}</Text>
      <Pressable
        onPress={() => setVisible(true)}
        className="bg-zinc-800 rounded-xl px-4 py-3"
      >
        <Text className="text-white" numberOfLines={2}>
          {displayLabel}
        </Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={handleClose}
        >
          <Pressable
            className="max-h-[75%] bg-zinc-900 rounded-t-3xl px-4 pt-4"
            style={{ paddingBottom: insets.bottom + 16 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-sans-semibold text-white mb-3">
              Select timezone
            </Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search timezones..."
              placeholderTextColor="#71717a"
              style={{ fontFamily: "Urbanist_400Regular" }}
              className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-3"
              autoCorrect={false}
              autoCapitalize="none"
            />
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredOptions.map((timezone) => (
                <Pressable
                  key={timezone.value}
                  onPress={() => {
                    onChange(timezone.value);
                    handleClose();
                  }}
                  className={`rounded-xl px-4 py-3 mb-2 ${
                    value === timezone.value ? "bg-approve/20" : "bg-zinc-800"
                  }`}
                >
                  <Text className="text-white">{timezone.label}</Text>
                </Pressable>
              ))}
              {filteredOptions.length === 0 ? (
                <Text className="text-zinc-400 text-sm text-center py-6">
                  No timezones match your search.
                </Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
