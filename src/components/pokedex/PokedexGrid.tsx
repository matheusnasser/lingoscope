import { FlatList, View, Text, Dimensions } from "react-native";
import PokedexCard from "./PokedexCard";
import { CapturedImage } from "../../services/storage/storageService";

interface PokedexGridProps {
  items: CapturedImage[];
}

const { width } = Dimensions.get("window");
const GAP = 12;
const COLUMNS = 2;
const PADDING = 24;
const CARD_WIDTH = (width - GAP * (COLUMNS - 1) - PADDING * 2) / COLUMNS;

export default function PokedexGrid({ items }: PokedexGridProps) {
  if (items.length === 0) {
    return (
      <View className="py-12 items-center">
        <Text className="text-coolGray text-base text-center">
          No items captured yet.{"\n"}Capture your first image to start your collection!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={({ item, index }) => (
        <View style={{ width: CARD_WIDTH }}>
          <PokedexCard item={item} index={index} />
        </View>
      )}
      keyExtractor={(item) => item.id || item.path}
      numColumns={COLUMNS}
      columnWrapperStyle={{ 
        paddingHorizontal: PADDING,
        justifyContent: 'space-between',
        marginBottom: GAP,
      }}
      contentContainerStyle={{ 
        paddingBottom: 20, 
        paddingTop: 8,
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}

