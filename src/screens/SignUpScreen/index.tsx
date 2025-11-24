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

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { session, error } = await authService.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert("Sign Up Failed", error.message);
        return;
      }

      if (session) {
        // Navigation will be handled by AuthNavigator based on onboarding status
      } else {
        // If no session but no error, email confirmation might be required
        // But if email verification is disabled, this shouldn't happen
        Alert.alert(
          "Success!",
          "Account created successfully. Please sign in.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try {
      const { session, error } = await signInWithOAuthProvider(provider);

      if (error) {
        Alert.alert("Sign Up Failed", error.message || "Authentication failed");
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
              Join us and start exploring
            </Text>
          </View>

          {/* Sign Up Form */}
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

            <View className="mb-6">
              <Text className="text-deepTeal text-sm font-semibold mb-2">
                Password
              </Text>
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="#9BA4B5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                className="bg-white border border-coolGray rounded-xl px-4 py-4 text-base text-nightshade"
              />
            </View>

            <View className="mb-8">
              <Text className="text-deepTeal text-sm font-semibold mb-2">
                Confirm Password
              </Text>
              <TextInput
                placeholder="Confirm your password"
                placeholderTextColor="#9BA4B5"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                className="bg-white border border-coolGray rounded-xl px-4 py-4 text-base text-nightshade"
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              className="bg-vibrantCoral rounded-xl px-6 py-4 items-center shadow-lg"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <Text className="text-white text-lg font-bold">
                {loading ? "Creating account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-px bg-coolGray" />
              <Text className="mx-4 text-coolGray text-sm">or</Text>
              <View className="flex-1 h-px bg-coolGray" />
            </View>

            {/* Social Sign Up Buttons */}
            <View className="gap-3">
              {/* Google Sign Up */}
              <TouchableOpacity
                onPress={() => handleSocialSignUp("google")}
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
                    ? "Signing up..."
                    : "Sign up with Google"}
                </Text>
              </TouchableOpacity>

              {/* Apple Sign Up */}
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  onPress={() => handleSocialSignUp("apple")}
                  disabled={!!socialLoading}
                  className="bg-nightshade rounded-xl px-6 py-4 flex-row items-center justify-center shadow-sm"
                  style={{ opacity: socialLoading === "apple" ? 0.7 : 1 }}
                >
                  <Text className="text-white text-lg mr-3">🍎</Text>
                  <Text className="text-white text-base font-semibold">
                    {socialLoading === "apple"
                      ? "Signing up..."
                      : "Sign up with Apple"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sign In Link */}
            <View className="mt-6 flex-row justify-center">
              <Text className="text-coolGray">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text className="text-deepTeal-light font-semibold">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

