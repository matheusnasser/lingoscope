import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LearnScreen() {
  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={[]}>
      <ScrollView 
        className="flex-1 px-6 py-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <Text className="text-3xl font-bold text-deepTeal mb-2">Learn</Text>
        <Text className="text-coolGray text-base mb-6">
          Start your language learning journey
        </Text>

        {/* Learning Progress */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-coolGray/20">
          <Text className="text-nightshade font-semibold text-base mb-3">
            Your Progress
          </Text>
          <View className="h-2 bg-coolGray/30 rounded-full mb-2">
            <View className="h-2 bg-vibrantCoral rounded-full" style={{ width: "30%" }} />
          </View>
          <Text className="text-coolGray text-xs">30% Complete</Text>
        </View>

        {/* Learning Modules */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-nightshade mb-4">Today's Lessons</Text>
          <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-coolGray/20">
            <Text className="text-nightshade font-semibold text-base mb-1">
              📖 Lesson 1: Greetings
            </Text>
            <Text className="text-coolGray text-sm">Learn basic greetings</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-coolGray/20">
            <Text className="text-nightshade font-semibold text-base mb-1">
              💬 Lesson 2: Conversations
            </Text>
            <Text className="text-coolGray text-sm">Practice daily conversations</Text>
          </TouchableOpacity>
        </View>

        {/* Start Learning Button */}
        <TouchableOpacity className="bg-deepTeal rounded-xl p-4 shadow-lg">
          <Text className="text-white font-bold text-lg text-center">
            Start Learning
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

