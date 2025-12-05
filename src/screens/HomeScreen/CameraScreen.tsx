import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import ImageSelector from "../../components/image/ImageSelector";
import { apiService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/user";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { AnalyzingScreen } from "../AnalyzingScreen";

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const isFocused = useIsFocused();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [image, setImage] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [baseLanguage, setBaseLanguage] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Fetch user's language preferences
  useEffect(() => {
    if (session?.user?.id) {
      userService.getUserLanguages(session.user.id).then(({ nativeLanguage, targetLanguages }) => {
        setBaseLanguage(nativeLanguage);
        setTargetLanguage(targetLanguages && targetLanguages.length > 0 ? targetLanguages[0] : null);
      });
    }
  }, [session]);

  // Request permissions on mount
  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [cameraPermission]);

  const handleTakePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert("Camera Not Ready", "Please wait for the camera to be ready.");
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setImage(photo.uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };

  const toggleCameraFacing = () => {
    setIsCameraReady(false); // Reset ready state when switching cameras
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  // Reset camera ready state when camera view is unmounted/remounted
  useEffect(() => {
    if (!isFocused) {
      setIsCameraReady(false);
    }
  }, [isFocused]);

  if (isAnalyzing) {
    return <AnalyzingScreen />;
  }

  if (!cameraPermission) {
    return (
      <SafeAreaView className="flex-1 bg-nightshade items-center justify-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-white mt-4">Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-nightshade items-center justify-center px-6">
        <Ionicons name="camera-outline" size={64} color="#FFFFFF" />
        <Text className="text-white text-xl font-bold mt-6 mb-2 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-white/70 text-center mb-6">
          We need access to your camera to take photos.
        </Text>
        <TouchableOpacity
          onPress={requestCameraPermission}
          className="bg-vibrantCoral rounded-xl px-8 py-4"
        >
          <Text className="text-white font-semibold text-lg">Grant Camera Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-nightshade" edges={[]}>
      {!image ? (
        <View className="flex-1">
          {isFocused && (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              onCameraReady={() => {
                setIsCameraReady(true);
              }}
            />
          )}
          
          {/* Top Controls */}
          <View className="absolute top-0 left-0 right-0 pt-4 px-6 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={toggleCameraFacing}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View className="absolute bottom-0 left-0 right-0 pb-8 items-center">
            {/* Capture Button */}
            <TouchableOpacity
              onPress={handleTakePicture}
              style={styles.captureButton}
              activeOpacity={0.8}
              disabled={!isCameraReady}
            >
              <View style={styles.outerCircle}>
                <View style={styles.middleCircle}>
                  <View style={styles.innerCircle}>
                    <View style={styles.centerDot} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            
            <Text className="text-white font-semibold mt-4 text-center">
              Tap to capture photo
            </Text>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          {/* Image selector for photos */}
          <ImageSelector
            imageUri={image!}
            initialSelection={selection ? {
              x: selection.x,
              y: selection.y,
              width: selection.width,
              height: selection.height,
            } : null}
            onSelectionChange={(sel) => {
              setSelection(sel);
            }}
            onConfirm={async (sel) => {
              if (!image) return;
              
              if (!baseLanguage || !targetLanguage) {
                Alert.alert(
                  "Language Preferences Required",
                  "Please complete your language preferences in your profile settings."
                );
                return;
              }
              
              setSelection(sel);
              setIsAnalyzing(true);
              
              try {
                const result = await apiService.analyzeUserImage(
                  image,
                  baseLanguage,
                  targetLanguage,
                  false
                );
                
                if (result.success && result.data) {
                  const data = result.data;
                  
                  // Log API response for debugging
                  console.log("=== API ANALYSIS RESPONSE ===");
                  console.log("Full API response:", JSON.stringify(data, null, 2));
                  console.log("detectedObjectBase:", data.detectedObjectBase);
                  console.log("detectedObjectTarget:", data.detectedObjectTarget);
                  console.log("detectedObjectTargetPinyin:", data.detectedObjectTargetPinyin);
                  console.log("contextSentence:", data.contextSentence);
                  console.log("contextSentencePinyin:", data.contextSentencePinyin);
                  console.log("contextFoundPhrase:", data.contextFoundPhrase);
                  console.log("examplePhrases:", JSON.stringify(data.examplePhrases, null, 2));
                  console.log("storagePath:", data.storagePath);
                  console.log("============================");
                  
                  // Navigate to results screen
                  navigation.navigate("AnalysisResult", {
                    imageUri: image,
                    detectedObjectBase: data.detectedObjectBase,
                    detectedObjectTarget: data.detectedObjectTarget,
                    detectedObjectTargetPinyin: data.detectedObjectTargetPinyin,
                    contextSentence: data.contextSentence,
                    contextSentencePinyin: data.contextSentencePinyin,
                    contextFoundPhrase: data.contextFoundPhrase,
                    examplePhrases: data.examplePhrases,
                    storagePath: data.storagePath,
                    pinyin: data.pinyin, // Legacy support
                  });
                  
                  // Reset for new capture
                  setImage(null);
                  setSelection(null);
                } else {
                  Alert.alert(
                    "Error",
                    result.error || "Failed to analyze image. Please try again."
                  );
                }
              } catch (error) {
                Alert.alert(
                  "Error",
                  "An unexpected error occurred. Please try again."
                );
              } finally {
                setIsAnalyzing(false);
              }
            }}
          />
          <TouchableOpacity
            onPress={() => {
              setImage(null);
              setSelection(null);
            }}
            className="mt-4 bg-white rounded-xl px-6 py-4 items-center"
          >
            <Text className="text-nightshade font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  outerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#0F4C5C",
    alignItems: "center",
    justifyContent: "center",
  },
  middleCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#FF6B58",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 107, 88, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255, 107, 88, 0.5)",
  },
});
