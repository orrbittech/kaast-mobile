import { View, Pressable, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CreatePlaylistScheduleFormValues } from "../lib/api/schemas";
import type { Device, DeviceTargetMode, RepeatType } from "../lib/api/types";
import {
  PRIORITY_CHIP_CLASSES,
  PRIORITY_OPTIONS,
  type SchedulePriority,
} from "../lib/constants/playlist-form";
import { FormDatePicker } from "./FormDatePicker";
import { FormTimePicker } from "./FormTimePicker";
import { TimezonePicker } from "./TimezonePicker";
import { Text } from "./ui/Text";

const APPROVE_HEX = "#16a34a";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom days" },
];
const TARGET_OPTIONS: { value: DeviceTargetMode; label: string }[] = [
  { value: "all", label: "All devices" },
  { value: "include", label: "Include only" },
  { value: "exclude", label: "Exclude selected" },
];

export type PlaylistScheduleFormState = CreatePlaylistScheduleFormValues;

interface PlaylistScheduleFormFieldsProps {
  form: PlaylistScheduleFormState;
  errors?: Record<string, string>;
  devices?: Device[];
  onChange: <K extends keyof PlaylistScheduleFormState>(
    key: K,
    value: PlaylistScheduleFormState[K],
  ) => void;
  onToggleDay: (day: number) => void;
  onToggleDevice: (deviceId: string) => void;
}

function fieldError(errors: Record<string, string> | undefined, path: string): string | undefined {
  return errors?.[`schedule.${path}`] ?? errors?.[path];
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedOptionRowProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  getButtonClassName?: (option: SegmentedOption<T>, selected: boolean) => string;
}

function SegmentedOptionRow<T extends string>({
  options,
  value,
  onSelect,
  getButtonClassName,
}: SegmentedOptionRowProps<T>) {
  return (
    <View className="flex-row gap-2 mb-4">
      {options.map((option) => {
        const selected = value === option.value;
        const buttonClassName = getButtonClassName
          ? getButtonClassName(option, selected)
          : selected
            ? "bg-approve"
            : "bg-zinc-800";

        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={`flex-1 py-2.5 rounded-lg items-center justify-center ${buttonClassName} ${
              selected ? "border-2 border-white" : "border-2 border-transparent"
            }`}
          >
            <Text className="text-white text-sm font-sans-medium text-center">
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getPriorityButtonClassName(
  option: SegmentedOption<SchedulePriority>,
  selected: boolean,
): string {
  const colorClass = PRIORITY_CHIP_CLASSES[option.value];
  return selected ? colorClass : `${colorClass} opacity-80`;
}

export function PlaylistScheduleFormFields({
  form,
  errors,
  devices,
  onChange,
  onToggleDay,
  onToggleDevice,
}: PlaylistScheduleFormFieldsProps) {
  const showDayPicker = form.repeatType === "weekly" || form.repeatType === "custom";
  const showDevicePicker = form.deviceTargetMode !== "all";

  return (
    <View>
      <FormTimePicker
        label="Start time"
        value={form.startTime}
        onChange={(startTime) => onChange("startTime", startTime)}
        error={fieldError(errors, "startTime")}
      />

      <FormTimePicker
        label="End time"
        value={form.endTime}
        onChange={(endTime) => onChange("endTime", endTime)}
        error={fieldError(errors, "endTime")}
      />

      <FormDatePicker
        label="Start date"
        value={form.startDate}
        onChange={(startDate) => onChange("startDate", startDate)}
        error={fieldError(errors, "startDate")}
      />

      <FormDatePicker
        label="End date"
        value={form.endDate ?? ""}
        onChange={(endDate) => onChange("endDate", endDate)}
        error={fieldError(errors, "endDate")}
        optional
      />

      <TimezonePicker
        value={form.timezone}
        onChange={(timezone) => onChange("timezone", timezone)}
      />

      <Text className="text-zinc-200 text-sm mb-2">Repeat</Text>
      <SegmentedOptionRow
        options={REPEAT_OPTIONS}
        value={form.repeatType}
        onSelect={(repeatType) => onChange("repeatType", repeatType as RepeatType)}
      />

      {showDayPicker && (
        <View className="mb-4">
          <Text className="text-zinc-200 text-sm mb-2">Days</Text>
          <View className="flex-row flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, index) => (
              <Pressable
                key={label}
                onPress={() => onToggleDay(index)}
                className={`px-3 py-2 rounded-lg ${
                  form.daysOfWeek.includes(index) ? "bg-approve" : "bg-zinc-800"
                }`}
              >
                <Text className="text-white text-sm">{label}</Text>
              </Pressable>
            ))}
          </View>
          {fieldError(errors, "daysOfWeek") ? (
            <Text className="text-primary text-xs mt-2">{fieldError(errors, "daysOfWeek")}</Text>
          ) : null}
        </View>
      )}

      <Text className="text-zinc-200 text-sm mb-2">Priority</Text>
      <SegmentedOptionRow
        options={PRIORITY_OPTIONS}
        value={form.priority}
        onSelect={(priority) => onChange("priority", priority)}
        getButtonClassName={getPriorityButtonClassName}
      />

      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-zinc-200">Loop playlist</Text>
        <Switch
          value={form.loopPlaylist}
          onValueChange={(loopPlaylist) => onChange("loopPlaylist", loopPlaylist)}
          trackColor={{ false: "#3f3f46", true: APPROVE_HEX }}
        />
      </View>

      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-zinc-200">Enabled</Text>
        <Switch
          value={form.enabled}
          onValueChange={(enabled) => onChange("enabled", enabled)}
          trackColor={{ false: "#3f3f46", true: APPROVE_HEX }}
        />
      </View>

      <Text className="text-zinc-200 text-sm mb-2">Device targeting</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {TARGET_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onChange("deviceTargetMode", option.value)}
            className={`px-3 py-2 rounded-lg ${
              form.deviceTargetMode === option.value ? "bg-approve" : "bg-zinc-800"
            }`}
          >
            <Text className="text-white text-sm">{option.label}</Text>
          </Pressable>
        ))}
      </View>

      {showDevicePicker && (
        <View className="mb-4">
          <Text className="text-zinc-200 text-sm mb-2">Devices</Text>
          <View className="gap-2">
            {devices?.map((device) => {
              const selected = form.deviceIds.includes(device.deviceId);
              return (
                <Pressable
                  key={device.id}
                  onPress={() => onToggleDevice(device.deviceId)}
                  className={`rounded-xl px-4 py-3 flex-row items-center justify-between ${
                    selected ? "bg-approve/20" : "bg-zinc-800"
                  }`}
                >
                  <Text className="text-white">{device.name}</Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={APPROVE_HEX} />
                  )}
                </Pressable>
              );
            })}
          </View>
          {fieldError(errors, "deviceIds") ? (
            <Text className="text-primary text-xs mt-2">{fieldError(errors, "deviceIds")}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export {
  WEEKDAY_LABELS,
  REPEAT_OPTIONS,
  TARGET_OPTIONS,
  APPROVE_HEX as SCHEDULE_FORM_APPROVE_HEX,
};
