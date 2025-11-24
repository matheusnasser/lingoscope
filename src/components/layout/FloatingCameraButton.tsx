import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/AppNavigator";

type FloatingCameraButtonNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FloatingCameraButtonProps {
  onImageCaptured?: (imageUri: string) => void;
}

export default function FloatingCameraButton({ onImageCaptured }: FloatingCameraButtonProps) {
  const navigation = useNavigation<FloatingCameraButtonNavigationProp>();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    // Navigate to camera screen
    if (onImageCaptured) {
      // If callback provided, navigate with callback
      navigation.navigate("Home", { 
        screen: "Camera"
      } as any);
    } else {
      // Otherwise just navigate to camera
      navigation.navigate("Home", { 
        screen: "Camera"
      } as any);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 20) + 20,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={styles.button}
        activeOpacity={0.8}
      >
        <View style={styles.outerCircle}>
          <View style={styles.middleCircle}>
            <View style={styles.innerCircle}>
              <View style={styles.centerDot} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  outerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#0F4C5C",
    alignItems: "center",
    justifyContent: "center",
  },
  middleCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#FF6B58",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 107, 88, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 107, 88, 0.5)",
  },
});

