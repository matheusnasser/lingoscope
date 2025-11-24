import React, { useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageSelectorProps {
  imageUri: string;
  onSelectionChange?: (selection: SelectionBox | null) => void;
  onConfirm?: (selection: SelectionBox) => void;
  initialSelection?: SelectionBox | null;
}

export default function ImageSelector({
  imageUri,
  onConfirm,
}: ImageSelectorProps) {
  const imageRef = useRef<View>(null);
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

  const handleImageLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setImageLayout({ width, height });
  };

  const handleConfirm = () => {
    // Analyze entire image (no selection/crop)
    onConfirm?.({
      x: 0,
      y: 0,
      width: imageLayout.width || 100,
      height: imageLayout.height || 100,
    });
  };

  return (
    <View className="w-full">
      <View
        ref={imageRef}
        onLayout={handleImageLayout}
        className="relative w-full"
        style={{ minHeight: 300 }}
      >
        <Image
          source={{ uri: imageUri }}
          className="w-full rounded-xl"
          style={{ aspectRatio: 1, resizeMode: "contain" }}
        />
      </View>

      {/* Action Button */}
      <View className="mt-4">
        <TouchableOpacity
          onPress={handleConfirm}
          className="w-full bg-vibrantCoral rounded-xl px-4 py-3 items-center"
        >
          <Text className="text-white font-semibold">Translate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

