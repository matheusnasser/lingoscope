import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Challenge } from "../../components/challenge/ChallengeCard";
import ChallengeList from "../../components/challenge/ChallengeList";

// Generate 10-day photo challenge
const generateChallenges = (): Challenge[] => {
  const challenges: Challenge[] = [
    { id: "1", title: "Food Challenge", description: "Take a photo of something that you can eat", completed: false, dayNumber: 1 },
    { id: "2", title: "Color Challenge", description: "Take a photo of something red that you can wear", completed: false, dayNumber: 2 },
    { id: "3", title: "Nature Challenge", description: "Take a photo of something green from nature", completed: false, dayNumber: 3 },
    { id: "4", title: "Daily Object Challenge", description: "Take a photo of something you use every day", completed: false, dayNumber: 4 },
    { id: "5", title: "Animal Challenge", description: "Take a photo of an animal or something related to animals", completed: false, dayNumber: 5 },
    { id: "6", title: "Transportation Challenge", description: "Take a photo of a vehicle or mode of transportation", completed: false, dayNumber: 6 },
    { id: "7", title: "Building Challenge", description: "Take a photo of a building or architectural structure", completed: false, dayNumber: 7 },
    { id: "8", title: "Technology Challenge", description: "Take a photo of an electronic device or gadget", completed: false, dayNumber: 8 },
    { id: "9", title: "Clothing Challenge", description: "Take a photo of an item of clothing or accessory", completed: false, dayNumber: 9 },
    { id: "10", title: "Final Challenge", description: "Take a photo of your favorite object from this week", completed: false, dayNumber: 10 },
  ];

  // Add dates starting from today
  const today = new Date();
  challenges.forEach((challenge, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    challenge.date = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  return challenges;
};

const MOCK_CHALLENGES = generateChallenges();

export default function ChallengesScreen() {
  const [challenges] = React.useState<Challenge[]>(MOCK_CHALLENGES);

  const completedCount = challenges.filter((c) => c.completed).length;
  const progress = (completedCount / challenges.length) * 100;

  return (
    <View className="flex-1 bg-offWhite">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-white border-b border-coolGray/20">
        <Text className="text-3xl font-bold text-deepTeal mb-2">
          10-Day Photo Challenge
        </Text>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-coolGray text-base">
            {completedCount} of {challenges.length} completed
          </Text>
          <View className="flex-row items-center">
            <View className="w-24 h-2 bg-coolGray/20 rounded-full mr-2">
              <View
                className="h-2 bg-vibrantCoral rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="text-deepTeal font-semibold text-sm">
              {Math.round(progress)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6">
          <ChallengeList challenges={challenges} />
        </View>
      </ScrollView>
    </View>
  );
}

