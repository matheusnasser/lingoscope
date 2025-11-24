import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { containsChinese } from "../../utils/pinyin";

type AnalysisResultScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;
type RouteParams = {
  imageUri: string;
  detectedObjectBase: string;
  detectedObjectTarget: string;
  detectedObjectTargetPinyin?: string;
  contextSentence: string;
  contextSentencePinyin?: string;
  examplePhrases: Array<{
    base: string;
    target: string;
    targetPinyin?: string;
  }>;
  storagePath: string;
  pinyin?: string; // Legacy field
};

export default function AnalysisResultScreen() {
  const navigation = useNavigation<AnalysisResultScreenNavigationProp>();
  const route = useRoute();
  const {
    imageUri,
    detectedObjectBase,
    detectedObjectTarget,
    detectedObjectTargetPinyin,
    contextSentence,
    contextSentencePinyin,
    examplePhrases,
    storagePath,
    pinyin, // Legacy field
  } = (route.params as RouteParams) || {};

  // Use detectedObjectTargetPinyin if available, fallback to pinyin for backward compatibility
  const objectPinyin = detectedObjectTargetPinyin || pinyin;

  const handleBack = () => {
    // Navigate to Home feed instead of going back
    navigation.navigate("Home");
  };

  const handleNewCapture = () => {
    navigation.navigate("Home");
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-deepTeal mb-2">
            Analysis Result
          </Text>
          <Text className="text-coolGray text-base">
            Here's what we found in your image
          </Text>
        </View>

        {/* Image */}
        {imageUri && (
          <View className="px-6 mb-6">
            <Image
              source={{ uri: imageUri }}
              className="w-full rounded-xl"
              style={{ aspectRatio: 1, resizeMode: "cover" }}
            />
          </View>
        )}

        {/* Detected Object */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-xl p-6 shadow-sm border border-coolGray/20">
            <Text className="text-coolGray text-sm mb-2">Detected Object</Text>
            <View className="mb-2">
              <View className="flex-row items-baseline flex-wrap">
                <Text className="text-2xl font-bold text-nightshade mr-2">
                  {detectedObjectTarget}
                </Text>
                {objectPinyin && containsChinese(detectedObjectTarget) && (
                  <Text className="text-base text-coolGray italic">
                    ({objectPinyin})
                  </Text>
                )}
              </View>
              <Text className="text-lg text-coolGray mt-1">
                ({detectedObjectBase})
              </Text>
            </View>
            <View className="h-px bg-coolGray/20 my-4" />
            <View>
              <Text className="text-nightshade text-base leading-6">
                {contextSentence}
              </Text>
              {contextSentencePinyin && containsChinese(contextSentence) && (
                <Text className="text-coolGray text-sm italic mt-2">
                  {contextSentencePinyin}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Example Phrases */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-nightshade mb-4">
            Example Phrases
          </Text>
          {examplePhrases && examplePhrases.length > 0 ? (
            <View className="gap-3">
              {examplePhrases.map((phrase, index) => (
                <View
                  key={index}
                  className="bg-white rounded-xl p-5 shadow-sm border border-coolGray/20"
                >
                  <View className="mb-2">
                    <Text className="text-nightshade font-semibold text-base">
                      {phrase.target}
                    </Text>
                    {phrase.targetPinyin && containsChinese(phrase.target) && (
                      <Text className="text-coolGray text-sm italic mt-1">
                        {phrase.targetPinyin}
                      </Text>
                    )}
                  </View>
                  <Text className="text-coolGray text-sm">{phrase.base}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-coolGray">No example phrases available</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View className="px-6 gap-3">
          <TouchableOpacity
            onPress={handleNewCapture}
            className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
          >
            <Text className="text-white text-lg font-bold">
              Capture Another Image
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBack}
            className="bg-white border-2 border-coolGray rounded-xl px-6 py-5 items-center"
          >
            <Text className="text-nightshade text-lg font-semibold">Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
