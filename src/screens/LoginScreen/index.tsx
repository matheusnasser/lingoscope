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
import { RootStackParamList } from "../../navigation/AppNavigator";
import { authService } from "../../services/auth";
import { signInWithOAuthProvider } from "../../services/auth/oauthHelper";

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const { session, error } = await authService.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }

      if (session) {
        // Navigation will be handled by AuthNavigator based on onboarding status
        // It will check if onboarding is completed and navigate accordingly
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { session, error } = await signInWithOAuthProvider(provider);

      if (error) {
        Alert.alert("Login Failed", error.message || "Authentication failed");
        return;
      }

      if (session) {
        // Navigation will be handled by AuthNavigator based on onboarding status
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-offWhite"
    >
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-6 py-12">
          {/* Logo/App Name */}
          <View className="mb-12 items-center">
            <Text className="text-5xl font-bold text-deepTeal mb-2">
              Lingoscope
            </Text>
            <Text className="text-lg text-coolGray">
              Explore languages, discover cultures
            </Text>
          </View>

          {/* Login Form */}
          <View className="w-full max-w-sm">
            <View className="mb-6">
              <Text className="text-deepTeal text-sm font-semibold mb-2">
                Email
              </Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#9BA4B5"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                className="bg-white border border-coolGray rounded-xl px-4 py-4 text-base text-nightshade"
              />
            </View>

            <View className="mb-8">
              <Text className="text-deepTeal text-sm font-semibold mb-2">
                Password
              </Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#9BA4B5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                className="bg-white border border-coolGray rounded-xl px-4 py-4 text-base text-nightshade"
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-vibrantCoral rounded-xl px-6 py-4 items-center shadow-lg"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <Text className="text-white text-lg font-bold">
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-px bg-coolGray" />
              <Text className="mx-4 text-coolGray text-sm">or</Text>
              <View className="flex-1 h-px bg-coolGray" />
            </View>

            {/* Social Login Buttons */}
            <View className="gap-3">
              {/* Google Login */}
              <TouchableOpacity
                onPress={() => handleSocialLogin("google")}
                disabled={!!socialLoading}
                className="bg-white border-2 border-coolGray rounded-xl px-6 py-4 flex-row items-center justify-center shadow-sm"
                style={{ opacity: socialLoading === "google" ? 0.7 : 1 }}
              >
                <View className="w-6 h-6 mr-3 items-center justify-center">
                  <Text
                    className="text-xl font-bold"
                    style={{ color: "#4285F4" }}
                  >
                    G
                  </Text>
                </View>
                <Text className="text-nightshade text-base font-semibold">
                  {socialLoading === "google"
                    ? "Signing in..."
                    : "Continue with Google"}
                </Text>
              </TouchableOpacity>

              {/* Apple Login */}
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  onPress={() => handleSocialLogin("apple")}
                  disabled={!!socialLoading}
                  className="bg-nightshade rounded-xl px-6 py-4 flex-row items-center justify-center shadow-sm"
                  style={{ opacity: socialLoading === "apple" ? 0.7 : 1 }}
                >
                  <Text className="text-white text-lg mr-3">🍎</Text>
                  <Text className="text-white text-base font-semibold">
                    {socialLoading === "apple"
                      ? "Signing in..."
                      : "Continue with Apple"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sign Up Link */}
            <View className="mt-6 flex-row justify-center">
              <Text className="text-coolGray">Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text className="text-deepTeal-light font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
