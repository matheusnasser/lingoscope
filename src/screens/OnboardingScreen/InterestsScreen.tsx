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

type InterestsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = {
  nativeLanguage: string;
  targetLanguage: string;
  proficiencyLevel: string;
  learningGoals: string[];
};

const INTERESTS = [
  { code: "food", name: "Food & Cooking", icon: "🍳" },
  { code: "sports", name: "Sports", icon: "⚽" },
  { code: "music", name: "Music", icon: "🎵" },
  { code: "movies", name: "Movies & TV", icon: "🎬" },
  { code: "books", name: "Books", icon: "📚" },
  { code: "technology", name: "Technology", icon: "💻" },
  { code: "art", name: "Art & Design", icon: "🎨" },
  { code: "nature", name: "Nature", icon: "🌳" },
];

export default function InterestsScreen() {
  const navigation = useNavigation<InterestsScreenNavigationProp>();
  const route = useRoute();
  const { session } = useAuth();
  const { nativeLanguage, targetLanguage, proficiencyLevel, learningGoals } = (route.params as RouteParams) || {};
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interestCode: string) => {
    if (selectedInterests.includes(interestCode)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interestCode));
    } else {
      setSelectedInterests([...selectedInterests, interestCode]);
    }
  };

  const handleComplete = async () => {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          interests: selectedInterests,
          onboarding_completed: true,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      navigation.navigate("Home");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to complete onboarding");
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
          What interests you?
        </Text>
        <Text className="text-xl text-coolGray text-center mb-8">
          Select topics you'd like to learn about (optional)
        </Text>

        <View className="mb-8">
          <View className="flex-row flex-wrap justify-between">
            {INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest.code}
                onPress={() => toggleInterest(interest.code)}
                className={`w-[48%] px-4 py-6 rounded-xl border-2 mb-4 items-center ${
                  selectedInterests.includes(interest.code)
                    ? "bg-deepTeal border-deepTeal"
                    : "bg-white border-coolGray"
                }`}
              >
                <Text className="text-3xl mb-2">{interest.icon}</Text>
                <Text
                  className={`text-sm font-semibold text-center ${
                    selectedInterests.includes(interest.code)
                      ? "text-white"
                      : "text-nightshade"
                  }`}
                >
                  {interest.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleComplete}
          disabled={loading}
          className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          <Text className="text-white text-lg font-bold">
            {loading ? "Completing..." : "Complete Setup"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}







