import { useState } from "react";
import { Platform, Pressable, Modal, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Text } from "./ui/Text";
import { formatDateString, parseDateString } from "../lib/constants/playlist-form";

interface FormDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  optional?: boolean;
}

export function FormDatePicker({
  label,
  value,
  onChange,
  error,
  optional,
}: FormDatePickerProps) {
  const [visible, setVisible] = useState(false);
  const dateValue = value?.trim() ? parseDateString(value) : new Date();

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") {
      setVisible(false);
    }
    if (event.type === "dismissed" || !selected) return;
    onChange(formatDateString(selected));
  }

  return (
    <View className="mb-3">
      <Text className="text-zinc-200 text-sm mb-2">
        {label}
        {optional ? " (optional)" : ""}
      </Text>
      <Pressable
        onPress={() => setVisible(true)}
        className="bg-zinc-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
      >
        <Text className="text-white">
          {value?.trim() ? value : "Select date"}
        </Text>
      </Pressable>
      {error ? <Text className="text-primary text-xs mt-1">{error}</Text> : null}

      {Platform.OS === "ios" ? (
        <Modal visible={visible} transparent animationType="slide">
          <Pressable
            className="flex-1 bg-black/60 justify-end"
            onPress={() => setVisible(false)}
          >
            <Pressable className="bg-zinc-900 rounded-t-3xl p-4" onPress={(e) => e.stopPropagation()}>
              <View className="flex-row justify-end mb-2">
                <Pressable onPress={() => setVisible(false)} className="py-2 px-4">
                  <Text className="text-approve font-sans-medium">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="spinner"
                themeVariant="dark"
                onChange={handleChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : visible ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
