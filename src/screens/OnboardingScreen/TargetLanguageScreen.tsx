import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../config/supabase";

type TargetLanguageScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = {
  nativeLanguage: string;
};

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

export default function TargetLanguageScreen() {
  const navigation = useNavigation<TargetLanguageScreenNavigationProp>();
  const route = useRoute();
  const { session } = useAuth();
  const { nativeLanguage } = (route.params as RouteParams) || { nativeLanguage: "" };
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Filter out native language from available options
  const availableLanguages = LANGUAGES.filter(
    (lang) => lang.code !== nativeLanguage
  );

  const handleComplete = async () => {
    if (!selectedLanguage) {
      Alert.alert("Error", "Please select the language you want to learn");
      return;
    }

    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to complete onboarding");
      return;
    }

    setLoading(true);
    try {
      // Save target language
      const { error } = await supabase
        .from("user_profiles")
        .update({
          target_languages: [selectedLanguage],
        })
        .eq("id", session.user.id);

      if (error) {
        Alert.alert("Error", "Failed to save your preferences. Please try again.");
        return;
      }

      navigation.navigate("OnboardingProficiency", {
        nativeLanguage,
        targetLanguage: selectedLanguage,
      } as any);
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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

  const selectedNativeLanguage = LANGUAGES.find(
    (lang) => lang.code === nativeLanguage
  )?.name || "your language";

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
              Great choice!
            </Text>
            <Text className="text-xl text-coolGray text-center px-4">
              What language do you want to learn?
            </Text>
            <Text className="text-base text-coolGray text-center px-4 mt-2">
              (We'll exclude {selectedNativeLanguage} from the list)
            </Text>
          </View>

          {/* Language Selection */}
          <View className="mb-8">
            {availableLanguages.map((lang) => (
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
              onPress={handleComplete}
              disabled={loading || !selectedLanguage}
              className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
              style={{ opacity: loading || !selectedLanguage ? 0.7 : 1 }}
            >
              <Text className="text-white text-lg font-bold">
                {loading ? "Saving..." : "Complete Setup"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

