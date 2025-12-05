import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = "Search your collection...",
}: SearchBarProps) {
  return (
    <View className="bg-white rounded-xl px-4 py-3 flex-row items-center border border-coolGray/20 shadow-sm">
      <Ionicons name="search" size={20} color="#9BA4B5" />
      <TextInput
        className="flex-1 ml-3 text-nightshade text-base"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9BA4B5"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} className="ml-2">
          <Ionicons name="close-circle" size={20} color="#9BA4B5" />
        </TouchableOpacity>
      )}
    </View>
  );
}








