import { useState, useEffect } from "react";
import { TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { detectLanguageForTTS } from "../../utils/languageDetection";

interface SpeakerButtonProps {
  text: string;
  language?: string;
  size?: number;
  color?: string;
}

export default function SpeakerButton({
  text,
  language, // Optional - if not provided, will auto-detect from text
  size = 20,
  color = "#0F4C5C",
}: SpeakerButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Configure audio mode on mount (for iOS silent mode)
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });
      } catch (error) {
        console.log("SpeakerButton: Audio mode configuration error:", error);
      }
    };
    configureAudio();

    return () => {
      Speech.stop();
    };
  }, []);

  const handlePress = async () => {
    if (!text || text.trim().length === 0) {
      console.log("SpeakerButton: No text to speak");
      return;
    }

    // Stop any ongoing speech
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      // Ensure audio mode is configured (especially for iOS)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      });

      // Stop any existing speech first
      Speech.stop();
      
      setIsSpeaking(true);
      
      const textToSpeak = text.trim();
      // Detect the language of the text itself
      const detectedLang = detectLanguageForTTS(textToSpeak);
      // Use provided language if given, otherwise use detected language
      const langCode = language || detectedLang;
      
      console.log("SpeakerButton: Speaking text:", textToSpeak.substring(0, 50), "Detected Language:", detectedLang, "Provided Language:", language, "Using Language:", langCode);
      
      // Speech.speak is synchronous, uses callbacks
      Speech.speak(textToSpeak, {
        language: langCode,
        pitch: 1.0,
        rate: 0.9,
        onStart: () => {
          console.log("SpeakerButton: Speech started");
          setIsSpeaking(true);
        },
        onDone: () => {
          console.log("SpeakerButton: Speech completed");
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log("SpeakerButton: Speech stopped");
          setIsSpeaking(false);
        },
        onError: (error: any) => {
          console.error("SpeakerButton: Speech error:", error);
          setIsSpeaking(false);
          // Show alert for errors
          const errorMessage = error?.message || String(error);
          if (errorMessage && !errorMessage.includes("cancelled")) {
            Alert.alert(
              "Audio Error",
              `Unable to play pronunciation: ${errorMessage}. Please check your device settings.`,
              [{ text: "OK" }]
            );
          }
        },
      });
    } catch (error: any) {
      console.error("SpeakerButton: Error speaking text:", error);
      setIsSpeaking(false);
      Alert.alert(
        "Audio Error",
        error?.message || "Unable to play pronunciation. Please check your device settings and ensure your device is not in silent mode.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="ml-2 p-1"
      disabled={!text || text.trim().length === 0}
      activeOpacity={0.7}
    >
      {isSpeaking ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name="volume-medium" size={size} color={color} />
      )}
    </TouchableOpacity>
  );
}

