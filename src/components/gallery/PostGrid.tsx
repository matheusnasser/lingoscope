import { View, Text, Image, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { CapturedImage } from "../../services/storage/storageService";

interface PostGridProps {
  posts: CapturedImage[];
}

type PostGridNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");
const GAP = 2;
const COLUMNS = 3;
const ITEM_SIZE = (width - GAP * (COLUMNS - 1)) / COLUMNS;

export default function PostGrid({ posts }: PostGridProps) {
  const navigation = useNavigation<PostGridNavigationProp>();

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
        detectedObjectTargetPinyin: post.detected_object_target_pinyin || post.pinyin,
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
      style={{ width: ITEM_SIZE, height: ITEM_SIZE, marginBottom: GAP }}
    >
      <Image
        source={{ uri: item.url }}
        className="w-full h-full"
        style={{ resizeMode: "cover" }}
      />
    </TouchableOpacity>
  );

  if (posts.length === 0) {
    return (
      <View className="py-12 items-center">
        <Text className="text-coolGray text-base text-center">
          No posts yet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id || item.path}
      numColumns={COLUMNS}
      columnWrapperStyle={{ gap: GAP }}
      scrollEnabled={false}
      contentContainerStyle={{ gap: GAP }}
    />
  );
}

