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

type GoalsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = {
  nativeLanguage: string;
  targetLanguage: string;
  proficiencyLevel: string;
};

const LEARNING_GOALS = [
  { code: "travel", name: "Travel", icon: "✈️" },
  { code: "work", name: "Work", icon: "💼" },
  { code: "education", name: "Education", icon: "🎓" },
  { code: "culture", name: "Culture", icon: "🎭" },
  { code: "family", name: "Family", icon: "👨‍👩‍👧‍👦" },
  { code: "hobby", name: "Hobby", icon: "🎨" },
];

export default function GoalsScreen() {
  const navigation = useNavigation<GoalsScreenNavigationProp>();
  const route = useRoute();
  const { session } = useAuth();
  const { nativeLanguage, targetLanguage, proficiencyLevel } = (route.params as RouteParams) || {};
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleGoal = (goalCode: string) => {
    if (selectedGoals.includes(goalCode)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goalCode));
    } else {
      setSelectedGoals([...selectedGoals, goalCode]);
    }
  };

  const handleContinue = async () => {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          learning_goals: selectedGoals,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      navigation.navigate("OnboardingInterests", {
        nativeLanguage,
        targetLanguage,
        proficiencyLevel,
        learningGoals: selectedGoals,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save goals");
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
          What are your goals?
        </Text>
        <Text className="text-xl text-coolGray text-center mb-8">
          Select all that apply (optional)
        </Text>

        <View className="mb-8">
          <View className="flex-row flex-wrap justify-between">
            {LEARNING_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.code}
                onPress={() => toggleGoal(goal.code)}
                className={`w-[48%] px-4 py-6 rounded-xl border-2 mb-4 items-center ${
                  selectedGoals.includes(goal.code)
                    ? "bg-deepTeal border-deepTeal"
                    : "bg-white border-coolGray"
                }`}
              >
                <Text className="text-3xl mb-2">{goal.icon}</Text>
                <Text
                  className={`text-base font-semibold ${
                    selectedGoals.includes(goal.code)
                      ? "text-white"
                      : "text-nightshade"
                  }`}
                >
                  {goal.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading}
          className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          <Text className="text-white text-lg font-bold">
            {loading ? "Saving..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}







