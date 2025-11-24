import { View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/AppNavigator";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

type CameraBottomBarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CameraBottomBarProps {
  onImageCaptured?: (imageUri: string) => void;
}

export default function CameraBottomBar({ onImageCaptured }: CameraBottomBarProps) {
  const navigation = useNavigation<CameraBottomBarNavigationProp>();
  const insets = useSafeAreaInsets();

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need camera permission to take photos."
      );
      return false;
    }
    return true;
  };

  const handleTakePicture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (onImageCaptured) {
          onImageCaptured(result.assets[0].uri);
        } else {
          // Navigate to camera screen
          navigation.navigate("Camera");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };

  return (
    <View
      style={{
        backgroundColor: "#F8F9FA",
        borderTopWidth: 1,
        borderTopColor: "#9BA4B5",
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
        alignItems: "center",
        justifyContent: "center",
        height: 60 + Math.max(insets.bottom, 0),
      }}
    >
      <TouchableOpacity
        onPress={handleTakePicture}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#1A1A2E",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 3,
          borderColor: "#FFFFFF",
          marginTop: -15,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 3,
            borderColor: "#0F4C5C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: "#FF6B58",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "rgba(255, 107, 88, 0.2)",
              }}
            />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

