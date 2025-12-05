import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../config/supabase";

type ProficiencyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = {
  nativeLanguage: string;
  targetLanguage: string;
};

const PROFICIENCY_LEVELS = [
  { code: "beginner", name: "Beginner", description: "Just starting out" },
  { code: "elementary", name: "Elementary", description: "Know some basics" },
  { code: "intermediate", name: "Intermediate", description: "Can have conversations" },
  { code: "advanced", name: "Advanced", description: "Fluent speaker" },
];

export default function ProficiencyScreen() {
  const navigation = useNavigation<ProficiencyScreenNavigationProp>();
  const route = useRoute();
  const { session } = useAuth();
  const { nativeLanguage, targetLanguage } = (route.params as RouteParams) || {};
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedLevel) {
      Alert.alert("Error", "Please select your proficiency level");
      return;
    }

    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          proficiency_level: selectedLevel,
        })
        .eq("id", session.user.id);

      if (error) {
        Alert.alert("Error", "Failed to save your preferences. Please try again.");
        return;
      }

      navigation.navigate("OnboardingGoals", {
        nativeLanguage,
        targetLanguage,
        proficiencyLevel: selectedLevel,
      } as any);
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-6 pt-12 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-4xl font-bold text-deepTeal mb-3 text-center">
          What's your level?
        </Text>
        <Text className="text-xl text-coolGray text-center mb-8">
          Help us personalize your learning experience
        </Text>

        <View className="mb-8">
          {PROFICIENCY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.code}
              onPress={() => setSelectedLevel(level.code)}
              className={`px-6 py-5 rounded-xl border-2 mb-4 ${
                selectedLevel === level.code
                  ? "bg-deepTeal border-deepTeal"
                  : "bg-white border-coolGray"
              }`}
            >
              <Text
                className={`text-lg font-semibold mb-1 ${
                  selectedLevel === level.code ? "text-white" : "text-nightshade"
                }`}
              >
                {level.name}
              </Text>
              <Text
                className={`text-sm ${
                  selectedLevel === level.code ? "text-white/80" : "text-coolGray"
                }`}
              >
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading || !selectedLevel}
          className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
          style={{ opacity: loading || !selectedLevel ? 0.7 : 1 }}
        >
          <Text className="text-white text-lg font-bold">
            {loading ? "Saving..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

