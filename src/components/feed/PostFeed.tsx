import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { CapturedImage } from "../../services/storage/storageService";
import { containsChinese } from "../../utils/pinyin";

interface PostFeedProps {
  posts: CapturedImage[];
}

type PostFeedNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PostFeed({ posts }: PostFeedProps) {
  const navigation = useNavigation<PostFeedNavigationProp>();

  const handlePostPress = (post: CapturedImage) => {
    if (
      post.detected_object_base &&
      post.detected_object_target &&
      post.context_sentence &&
      post.example_phrases
    ) {
      navigation.navigate("AnalysisResult", {
        imageUri: post.url,
        detectedObjectBase: post.detected_object_base,
        detectedObjectTarget: post.detected_object_target,
        detectedObjectTargetPinyin:
          post.detected_object_target_pinyin || post.pinyin,
        contextSentence: post.context_sentence,
        contextSentencePinyin: post.context_sentence_pinyin,
        contextFoundPhrase: post.context_found_phrase,
        examplePhrases: post.example_phrases,
        storagePath: post.storage_path,
        pinyin: post.pinyin, // Legacy support
      });
    }
  };

  const renderPost = ({ item }: { item: CapturedImage }) => (
    <TouchableOpacity
      onPress={() => handlePostPress(item)}
      className="bg-white rounded-xl mb-4 shadow-sm border border-coolGray/20 overflow-hidden"
    >
      {/* Image */}
      <View style={{ width: "100%", height: 400, backgroundColor: "#f5f5f5" }}>
        <Image
          source={{ uri: item.url }}
          className="w-full h-full"
          style={{ resizeMode: "contain" }}
        />
      </View>

      {/* Post Info */}
      <View className="p-4 pt-3">
        {item.detected_object_target && (
          <View className="mb-2">
            <Text className="text-nightshade font-bold text-base">
              {item.detected_object_target}
            </Text>
            {/* Show pinyin if available and text contains Chinese */}
            {(item.detected_object_target_pinyin || item.pinyin) &&
              containsChinese(item.detected_object_target) && (
                <Text className="text-coolGray text-xs italic mt-0.5">
                  {item.detected_object_target_pinyin || item.pinyin}
                </Text>
              )}
            {item.detected_object_base && (
              <Text className="text-coolGray text-sm mt-1">
                {item.detected_object_base}
              </Text>
            )}
          </View>
        )}
        {item.context_sentence && (
          <View className="mt-2">
            <Text className="text-nightshade text-sm leading-5">
              {item.context_sentence}
            </Text>
            {item.detected_object_base && (
              <Text className="text-coolGray text-xs mt-1">
                ({item.detected_object_base})
              </Text>
            )}
            {item.context_sentence_pinyin &&
              containsChinese(item.context_sentence) && (
                <Text className="text-coolGray text-xs italic mt-1">
                  {item.context_sentence_pinyin}
                </Text>
              )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (posts.length === 0) {
    return (
      <View className="py-12 items-center">
        <Text className="text-coolGray text-base text-center">
          No posts yet.{"\n"}Capture your first image to get started!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id || item.path}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}
