import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/AppNavigator";

type NativeLanguageScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Common languages - you can expand this list
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

export default function NativeLanguageScreen() {
  const navigation = useNavigation<NativeLanguageScreenNavigationProp>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const handleContinue = () => {
    if (!selectedLanguage) {
      return;
    }
    // Navigate to target language screen with native language
    navigation.navigate("OnboardingTargetLanguage", {
      nativeLanguage: selectedLanguage,
    });
  };

  const LanguageButton = ({
    language,
    isSelected,
    onPress,
  }: {
    language: { code: string; name: string };
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-6 py-5 rounded-xl border-2 mb-4 ${
        isSelected
          ? "bg-deepTeal border-deepTeal"
          : "bg-white border-coolGray"
      }`}
    >
      <Text
        className={`text-lg font-semibold ${
          isSelected ? "text-white" : "text-nightshade"
        }`}
      >
        {language.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-6 pt-12 pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Header */}
          <View className="mb-12 items-center">
            <Text className="text-4xl font-bold text-deepTeal mb-3">
              Welcome to Lingoscope!
            </Text>
            <Text className="text-xl text-coolGray text-center px-4">
              What is your native language?
            </Text>
          </View>

          {/* Language Selection */}
          <View className="mb-8">
            {LANGUAGES.map((lang) => (
              <LanguageButton
                key={lang.code}
                language={lang}
                isSelected={selectedLanguage === lang.code}
                onPress={() => setSelectedLanguage(lang.code)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Fixed Footer Button */}
        <SafeAreaView edges={["bottom"]} className="bg-offWhite border-t border-coolGray/20">
          <View className="px-6 py-4">
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!selectedLanguage}
              className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
              style={{ opacity: !selectedLanguage ? 0.7 : 1 }}
            >
              <Text className="text-white text-lg font-bold">Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

