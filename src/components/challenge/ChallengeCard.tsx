import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../navigation/AppNavigator";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dayNumber: number;
  date?: string;
}

interface ChallengeCardProps {
  challenge: Challenge;
  currentIndex: number;
  totalChallenges: number;
}

type ChallengeCardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChallengeCard({
  challenge,
  currentIndex,
  totalChallenges,
}: ChallengeCardProps) {
  const navigation = useNavigation<ChallengeCardNavigationProp>();

  const handleStartChallenge = () => {
    // Navigate to camera screen
    navigation.navigate("Home", {
      screen: "Camera",
    } as any);
  };

  return (
    <View className="bg-white rounded-xl p-6 mb-4 shadow-sm border border-coolGray/20">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
            challenge.completed ? 'bg-vibrantCoral' : 'bg-deepTeal'
          }`}>
            {challenge.completed ? (
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-lg">{challenge.dayNumber}</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-nightshade font-bold text-lg">
              Day {challenge.dayNumber}
            </Text>
            {challenge.date && (
              <Text className="text-coolGray text-xs mt-0.5">{challenge.date}</Text>
            )}
          </View>
        </View>
        {challenge.completed && (
          <View className="w-8 h-8 rounded-full bg-vibrantCoral items-center justify-center ml-2">
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Challenge Description */}
      <Text className="text-nightshade text-base mb-4 leading-6">
        {challenge.description}
      </Text>

      {/* Action Button */}
      {!challenge.completed ? (
        <TouchableOpacity
          onPress={handleStartChallenge}
          className="bg-vibrantCoral rounded-xl px-6 py-4 items-center flex-row justify-center"
        >
          <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text className="text-white font-semibold text-base">Capture Photo</Text>
        </TouchableOpacity>
      ) : (
        <View className="bg-coolGray/20 rounded-xl px-6 py-4 items-center">
          <Text className="text-coolGray font-semibold text-base">Completed ✓</Text>
        </View>
      )}
    </View>
  );
}

