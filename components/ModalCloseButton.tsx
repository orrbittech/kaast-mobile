import { Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme/colors";

interface ModalCloseButtonProps {
  onPress: () => void;
}

export function ModalCloseButton({ onPress }: ModalCloseButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Close"
      className="w-10 h-10 rounded-full items-center justify-center active:opacity-80"
      style={{ backgroundColor: `${colors.primaryHex}26` }}
    >
      <Ionicons name="close" size={24} color={colors.primaryHex} />
    </Pressable>
  );
}
