import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { CapturedImage } from "../../services/storage/storageService";
import { containsChinese } from "../../utils/pinyin";

interface PokedexCardProps {
  item: CapturedImage;
  index: number;
}

type PokedexCardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PokedexCard({ item, index }: PokedexCardProps) {
  const navigation = useNavigation<PokedexCardNavigationProp>();

  const handlePress = () => {
    if (
      item.detected_object_base &&
      item.detected_object_target &&
      item.context_sentence &&
      item.example_phrases
    ) {
      navigation.navigate("AnalysisResult", {
        imageUri: item.url,
        detectedObjectBase: item.detected_object_base,
        detectedObjectTarget: item.detected_object_target,
        detectedObjectTargetPinyin:
          item.detected_object_target_pinyin || item.pinyin,
        contextSentence: item.context_sentence,
        contextSentencePinyin: item.context_sentence_pinyin,
        contextFoundPhrase: item.context_found_phrase,
        examplePhrases: item.example_phrases,
        storagePath: item.storage_path,
        pinyin: item.pinyin,
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.card}
      activeOpacity={0.8}
    >
      {/* Card Header - Number */}
      <View className="absolute top-2 right-2 z-10">
        <View className="bg-deepTeal/90 rounded-full px-2 py-1">
          <Text className="text-white text-xs font-bold">#{String(index + 1).padStart(3, '0')}</Text>
        </View>
      </View>

      {/* Image Container */}
      <View className="bg-offWhite rounded-t-xl overflow-hidden" style={styles.imageContainer}>
        <Image
          source={{ uri: item.url }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Card Footer - Info */}
      <View className="bg-white rounded-b-xl p-3 border-t-2 border-deepTeal/10">
        {item.detected_object_target && (
          <View className="mb-1">
            <Text className="text-nightshade font-bold text-base" numberOfLines={1}>
              {item.detected_object_target}
            </Text>
            {(item.detected_object_target_pinyin || item.pinyin) &&
              containsChinese(item.detected_object_target) && (
                <Text className="text-deepTeal text-xs italic mt-0.5 font-medium" numberOfLines={1}>
                  {item.detected_object_target_pinyin || item.pinyin}
                </Text>
              )}
          </View>
        )}
        {item.detected_object_base && (
          <Text className="text-coolGray text-xs mt-1" numberOfLines={1}>
            {item.detected_object_base}
          </Text>
        )}
        {item.created_at && (
          <Text className="text-coolGray text-xs mt-2 opacity-70">
            {new Date(item.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F8F9FA",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

