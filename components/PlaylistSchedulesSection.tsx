import { useMemo, useState } from 'react';
import {
    View,
    Pressable,
    Modal,
    ActivityIndicator,
    ScrollView,
    Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    usePlaylistSchedules,
    useCreatePlaylistSchedule,
    useUpdatePlaylistSchedule,
    useDeletePlaylistSchedule,
    useDevices,
    useActiveOrgContext,
} from '../lib/hooks';
import type {
    CreatePlaylistSchedule,
    PlaylistSchedule,
} from '../lib/api/types';
import {
    PlaylistScheduleFormFields,
    SCHEDULE_FORM_APPROVE_HEX,
    type PlaylistScheduleFormState,
} from './PlaylistScheduleFormFields';
import { Text } from './ui/Text';
import { ConfirmModal } from './ConfirmModal';
import { colors } from '../lib/theme/colors';
import {
    formatTimeLabel,
    formatPriorityLabel,
    normalizeSchedulePriority,
} from '../lib/constants/playlist-form';

function todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatRepeatLabel(schedule: PlaylistSchedule): string {
    if (schedule.repeatType === 'none') return 'Once';
    if (schedule.repeatType === 'daily') return 'Daily';
    if (schedule.daysOfWeek.length === 0) return schedule.repeatType;
    return schedule.daysOfWeek
        .slice()
        .sort((a, b) => a - b)
        .map((day) => WEEKDAY_LABELS[day])
        .join(', ');
}

function defaultFormState(): PlaylistScheduleFormState {
    return {
        startTime: '09:00',
        endTime: '17:00',
        startDate: todayDateString(),
        endDate: '',
        repeatType: 'daily',
        daysOfWeek: [],
        timezone: 'UTC',
        priority: 'medium',
        enabled: true,
        loopPlaylist: true,
        deviceTargetMode: 'all',
        deviceIds: [],
    };
}

function scheduleToForm(schedule: PlaylistSchedule): PlaylistScheduleFormState {
    return {
        startTime: formatTimeLabel(schedule.startTime),
        endTime: formatTimeLabel(schedule.endTime),
        startDate: schedule.startDate,
        endDate: schedule.endDate ?? '',
        repeatType: schedule.repeatType,
        daysOfWeek: schedule.daysOfWeek ?? [],
        timezone: schedule.timezone,
        priority: normalizeSchedulePriority(schedule.priority),
        enabled: schedule.enabled,
        loopPlaylist: schedule.loopPlaylist,
        deviceTargetMode: schedule.deviceTargetMode,
        deviceIds: schedule.deviceIds ?? [],
    };
}

function formToPayload(form: PlaylistScheduleFormState): CreatePlaylistSchedule {
    return {
        startTime: form.startTime,
        endTime: form.endTime,
        startDate: form.startDate,
        endDate: form.endDate?.trim() ? form.endDate.trim() : null,
        repeatType: form.repeatType,
        daysOfWeek:
            form.repeatType === 'weekly' || form.repeatType === 'custom'
                ? form.daysOfWeek
                : [],
        timezone: form.timezone,
        priority: form.priority,
        enabled: form.enabled,
        loopPlaylist: form.loopPlaylist,
        deviceTargetMode: form.deviceTargetMode,
        deviceIds:
            form.deviceTargetMode === 'all' ? [] : form.deviceIds,
    };
}

interface PlaylistSchedulesSectionProps {
    playlistId: string;
}

export function PlaylistSchedulesSection({ playlistId }: PlaylistSchedulesSectionProps) {
    const insets = useSafeAreaInsets();
    const { clerkOrgId } = useActiveOrgContext();
    const { data: schedules, isLoading } = usePlaylistSchedules(playlistId);
    const { data: devices } = useDevices(clerkOrgId);
    const createSchedule = useCreatePlaylistSchedule(playlistId);
    const updateSchedule = useUpdatePlaylistSchedule(playlistId);
    const deleteSchedule = useDeletePlaylistSchedule(playlistId);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<PlaylistSchedule | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<PlaylistSchedule | null>(null);
    const [form, setForm] = useState<PlaylistScheduleFormState>(defaultFormState);

    const sortedSchedules = useMemo(
        () => [...(schedules ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime)),
        [schedules],
    );

    const openCreateModal = () => {
        setEditingSchedule(null);
        setForm(defaultFormState());
        setModalVisible(true);
    };

    const openEditModal = (schedule: PlaylistSchedule) => {
        setEditingSchedule(schedule);
        setForm(scheduleToForm(schedule));
        setModalVisible(true);
    };

    const setScheduleField = <K extends keyof PlaylistScheduleFormState>(
        key: K,
        value: PlaylistScheduleFormState[K],
    ) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const toggleDay = (day: number) => {
        setForm((current) => {
            const exists = current.daysOfWeek.includes(day);
            return {
                ...current,
                daysOfWeek: exists
                    ? current.daysOfWeek.filter((d) => d !== day)
                    : [...current.daysOfWeek, day],
            };
        });
    };

    const toggleDevice = (deviceId: string) => {
        setForm((current) => {
            const exists = current.deviceIds.includes(deviceId);
            return {
                ...current,
                deviceIds: exists
                    ? current.deviceIds.filter((id) => id !== deviceId)
                    : [...current.deviceIds, deviceId],
            };
        });
    };

    const handleSave = async () => {
        const payload = formToPayload(form);
        try {
            if (editingSchedule) {
                await updateSchedule.mutateAsync({
                    scheduleId: editingSchedule.id,
                    body: payload,
                });
            } else {
                await createSchedule.mutateAsync(payload);
            }
            setModalVisible(false);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const handleToggleEnabled = async (schedule: PlaylistSchedule) => {
        try {
            await updateSchedule.mutateAsync({
                scheduleId: schedule.id,
                body: { enabled: !schedule.enabled },
            });
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const onConfirmDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteSchedule.mutateAsync(confirmDelete.id);
            setConfirmDelete(null);
        } catch {
            // Global NetworkErrorHandler shows error
        }
    };

    const isSaving = createSchedule.isPending || updateSchedule.isPending;

    return (
        <View className="mt-8">
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-zinc-200 text-sm font-sans-medium">Schedules</Text>
                <Pressable
                    onPress={openCreateModal}
                    className="flex-row items-center gap-1 py-1 px-2 rounded-lg bg-zinc-800 active:opacity-80"
                >
                    <Ionicons name="add" size={16} color={SCHEDULE_FORM_APPROVE_HEX} />
                    <Text className="text-approve text-sm font-sans-medium">Add slot</Text>
                </Pressable>
            </View>
            <Text className="text-zinc-300 text-xs mb-1">
                Scheduled slots override manual device assignment during their window.
            </Text>
            <Text className="text-zinc-400 text-xs mb-3">
                Add separate slots for multiple windows (e.g. 06:00–07:00 and 20:00–21:00, repeat
                Daily).
            </Text>

            {isLoading && (
                <View className="py-6 items-center">
                    <ActivityIndicator size="small" color={colors.primaryHex} />
                </View>
            )}

            {!isLoading && sortedSchedules.length === 0 && (
                <View className="py-6 px-4 rounded-xl bg-zinc-800">
                    <Text className="text-zinc-200 text-center">
                        No schedule slots yet. Add times when this playlist should play.
                    </Text>
                </View>
            )}

            <View className="gap-3">
                {sortedSchedules.map((schedule) => (
                    <View
                        key={schedule.id}
                        className="rounded-xl bg-zinc-800 p-4"
                    >
                        <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                                <Text className="font-sans-medium text-white">
                                    {formatTimeLabel(schedule.startTime)} –{' '}
                                    {formatTimeLabel(schedule.endTime)}
                                </Text>
                                <Text className="text-zinc-300 text-sm mt-1">
                                    {formatRepeatLabel(schedule)} · {formatPriorityLabel(schedule.priority)} priority
                                </Text>
                                <Text className="text-zinc-400 text-xs mt-1">
                                    {schedule.deviceTargetMode === 'all'
                                        ? 'All devices'
                                        : `${schedule.deviceTargetMode}: ${schedule.deviceIds.length} device(s)`}
                                </Text>
                            </View>
                            <Switch
                                value={schedule.enabled}
                                onValueChange={() => void handleToggleEnabled(schedule)}
                                trackColor={{ false: '#3f3f46', true: SCHEDULE_FORM_APPROVE_HEX }}
                            />
                        </View>
                        <View className="flex-row gap-2 mt-3">
                            <Pressable
                                onPress={() => openEditModal(schedule)}
                                className="py-2 px-3 rounded-lg bg-zinc-700 active:opacity-80"
                            >
                                <Text className="text-white text-sm font-sans-medium">Edit</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => setConfirmDelete(schedule)}
                                className="py-2 px-3 rounded-lg bg-zinc-700 active:opacity-80"
                            >
                                <Text className="text-primary text-sm font-sans-medium">
                                    Delete
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                ))}
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="max-h-[90%] rounded-t-3xl bg-zinc-900 px-6 pt-6">
                        <Text className="text-lg font-sans-semibold text-white mb-4">
                            {editingSchedule ? 'Edit schedule slot' : 'New schedule slot'}
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <PlaylistScheduleFormFields
                                form={form}
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
                                onPress={() => setModalVisible(false)}
                                className="flex-1 py-3 rounded-xl bg-zinc-800 items-center"
                            >
                                <Text className="font-sans-medium text-white">Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => void handleSave()}
                                disabled={isSaving}
                                className="flex-1 py-3 rounded-xl bg-approve items-center disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text className="font-sans-medium text-white">Save</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <ConfirmModal
                visible={!!confirmDelete}
                title="Delete schedule?"
                message="This time slot will stop playing on targeted devices."
                confirmText="Delete"
                onConfirm={() => void onConfirmDelete()}
                onCancel={() => setConfirmDelete(null)}
            />
        </View>
    );
}
