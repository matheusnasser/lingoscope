import { View, Text, Image, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { CapturedImage } from "../../services/storage/storageService";

interface ImageGalleryProps {
  images: CapturedImage[];
  onImagePress?: (image: CapturedImage) => void;
}

type ImageGalleryNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");
const GAP = 12;
const COLUMNS = 2;
const ITEM_SIZE = (width - GAP * (COLUMNS + 1) - 48) / COLUMNS; // 48 = padding (24 * 2)

export default function ImageGallery({ images, onImagePress }: ImageGalleryProps) {
  const navigation = useNavigation<ImageGalleryNavigationProp>();

  const handleImagePress = (image: CapturedImage) => {
    if (onImagePress) {
      onImagePress(image);
    } else {
      // Navigate to analysis result with data from user_posts table
      if (
        image.detected_object_base &&
        image.detected_object_target &&
        image.context_sentence &&
        image.example_phrases
      ) {
        navigation.navigate("AnalysisResult", {
          imageUri: image.url,
          detectedObjectBase: image.detected_object_base,
          detectedObjectTarget: image.detected_object_target,
          detectedObjectTargetPinyin: image.detected_object_target_pinyin || image.pinyin,
          contextSentence: image.context_sentence,
          contextSentencePinyin: image.context_sentence_pinyin,
          examplePhrases: image.example_phrases,
          storagePath: image.storage_path,
          pinyin: image.pinyin, // Legacy support
        });
      }
    }
  };

  const renderImageItem = ({ item }: { item: CapturedImage }) => (
    <TouchableOpacity
      onPress={() => handleImagePress(item)}
      className="mb-3"
      style={{ width: ITEM_SIZE }}
    >
      <Image
        source={{ uri: item.url }}
        className="rounded-xl"
        style={{
          width: ITEM_SIZE,
          height: ITEM_SIZE,
          resizeMode: "cover",
        }}
      />
    </TouchableOpacity>
  );

  if (images.length === 0) {
    return (
      <View className="py-12 items-center">
        <Text className="text-coolGray text-base text-center">
          No images captured yet.{"\n"}Take your first photo to get started!
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-xl font-bold text-nightshade mb-4">
        Your Gallery ({images.length})
      </Text>
      <FlatList
        data={images}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.id || item.path}
        numColumns={COLUMNS}
        columnWrapperStyle={{ gap: GAP }}
        scrollEnabled={false}
        contentContainerStyle={{ gap: GAP }}
      />
    </View>
  );
}

