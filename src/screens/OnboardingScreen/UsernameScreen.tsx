import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../config/supabase";

type UsernameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function UsernameScreen() {
  const navigation = useNavigation<UsernameScreenNavigationProp>();
  const { session } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!username || username.trim().length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters");
      return;
    }

    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: session.user.id,
          username: username.trim(),
          subscription_plan: "free",
        }, {
          onConflict: "id",
        });

      if (error) throw error;

      navigation.navigate("OnboardingNativeLanguage");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 pt-12 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center">
            <Text className="text-4xl font-bold text-deepTeal mb-3 text-center">
              Welcome to Lingoscope!
            </Text>
            <Text className="text-xl text-coolGray text-center mb-8">
              Let's start by choosing your username
            </Text>

            <View className="mb-8">
              <Text className="text-deepTeal text-sm font-semibold mb-2">
                Username
              </Text>
              <TextInput
                placeholder="Choose a username"
                placeholderTextColor="#9BA4B5"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
                className="bg-white border border-coolGray rounded-xl px-4 py-4 text-base text-nightshade"
                maxLength={20}
              />
              <Text className="text-coolGray text-xs mt-2">
                This will be your display name. You can change it later.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading || username.trim().length < 3}
            className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
            style={{ opacity: loading || username.trim().length < 3 ? 0.7 : 1 }}
          >
            <Text className="text-white text-lg font-bold">
              {loading ? "Saving..." : "Continue"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}







