import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressChart from "../../components/chart/ProgressChart";
import PostGrid from "../../components/gallery/PostGrid";
import { useAuth } from "../../context/AuthContext";
import {
  CapturedImage,
  storageService,
} from "../../services/storage/storageService";
import { UserProfile, userService } from "../../services/user";
import { paymentService } from "../../services/payment/paymentService";
import { RootStackParamList } from "../../navigation/AppNavigator";

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
};

export default function ProfileScreen() {
  const { signOut, session } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<CapturedImage[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isEditingLanguages, setIsEditingLanguages] = useState(false);
  const [selectedNativeLanguage, setSelectedNativeLanguage] =
    useState<string>("");
  const [selectedTargetLanguages, setSelectedTargetLanguages] = useState<
    string[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      userService.getUserProfile(session.user.id).then((profile) => {
        setProfile(profile);
        if (profile) {
          setSelectedNativeLanguage(profile.native_language || "");
          setSelectedTargetLanguages(profile.target_languages || []);
        }
      });
    }
  }, [session]);

  // Fetch user posts when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadPosts = async () => {
        if (session?.user?.id) {
          setIsLoadingPosts(true);
          const userPosts = await storageService.getUserImages(session.user.id);
          setPosts(userPosts);
          setIsLoadingPosts(false);
        }
      };
      loadPosts();
    }, [session])
  );

  const handleSignOut = async () => {
    await signOut();
  };

  const handleEditLanguages = () => {
    setIsEditingLanguages(true);
    if (profile) {
      setSelectedNativeLanguage(profile.native_language || "");
      setSelectedTargetLanguages(profile.target_languages || []);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingLanguages(false);
    if (profile) {
      setSelectedNativeLanguage(profile.native_language || "");
      setSelectedTargetLanguages(profile.target_languages || []);
    }
  };

  const handleSaveLanguages = async () => {
    if (!selectedNativeLanguage) {
      Alert.alert("Error", "Please select your native language");
      return;
    }

    if (selectedTargetLanguages.length === 0) {
      Alert.alert("Error", "Please select at least one target language");
      return;
    }

    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in to update preferences");
      return;
    }

    setIsSaving(true);
    try {
      const { profile: updatedProfile, error } =
        await userService.updateLanguagePreferences(session.user.id, {
          native_language: selectedNativeLanguage,
          target_languages: selectedTargetLanguages,
        });

      if (error) {
        Alert.alert(
          "Error",
          "Failed to update language preferences. Please try again."
        );
        return;
      }

      if (updatedProfile) {
        setProfile(updatedProfile);
        setIsEditingLanguages(false);
        Alert.alert("Success", "Language preferences updated successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTargetLanguage = (languageCode: string) => {
    if (selectedTargetLanguages.includes(languageCode)) {
      setSelectedTargetLanguages(
        selectedTargetLanguages.filter((lang) => lang !== languageCode)
      );
    } else {
      setSelectedTargetLanguages([...selectedTargetLanguages, languageCode]);
    }
  };

  const getLanguageName = (code: string) => LANGUAGE_NAMES[code] || code;

  const availableTargetLanguages = LANGUAGES.filter(
    (lang) => lang.code !== selectedNativeLanguage
  );

  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={[]}>
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <Text className="text-3xl font-bold text-deepTeal mb-6">Profile</Text>

        {/* Profile Info Card */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-coolGray/20">
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-deepTeal items-center justify-center mb-3">
              {profile?.username ? (
                <Text className="text-white text-3xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </Text>
              ) : session?.user?.email ? (
                <Text className="text-white text-3xl font-bold">
                  {session.user.email.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Ionicons name="person" size={32} color="#FFFFFF" />
              )}
            </View>
            <Text className="text-nightshade text-xl font-bold">
              {profile?.username ||
                session?.user?.email?.split("@")[0] ||
                "User"}
            </Text>
            {session?.user?.email && (
              <Text className="text-coolGray text-sm mt-1">
                {session.user.email}
              </Text>
            )}
          </View>
        </View>

        {/* Progress Chart */}
        {posts.length > 0 && (
          <View className="mb-6">
            <ProgressChart posts={posts} />
          </View>
        )}

        {/* Language Info */}
        {profile && (
          <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-coolGray/20">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-nightshade font-semibold text-base">
                Language Preferences
              </Text>
              {!isEditingLanguages ? (
                <TouchableOpacity onPress={handleEditLanguages}>
                  <Ionicons name="create-outline" size={20} color="#0F4C5C" />
                </TouchableOpacity>
              ) : (
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={handleCancelEdit}>
                    <Text className="text-coolGray font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveLanguages}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#0F4C5C" />
                    ) : (
                      <Text className="text-deepTeal font-semibold">Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {isEditingLanguages ? (
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                {/* Native Language Selection */}
                <View className="mb-6">
                  <Text className="text-coolGray text-sm mb-3 font-semibold">
                    Native Language
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-2"
                  >
                    <View className="flex-row gap-2">
                      {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                          key={lang.code}
                          onPress={() => {
                            setSelectedNativeLanguage(lang.code);
                            // Remove native language from target languages if selected
                            setSelectedTargetLanguages(
                              selectedTargetLanguages.filter(
                                (l) => l !== lang.code
                              )
                            );
                          }}
                          className={`px-4 py-2 rounded-lg border-2 ${
                            selectedNativeLanguage === lang.code
                              ? "bg-deepTeal border-deepTeal"
                              : "bg-white border-coolGray"
                          }`}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              selectedNativeLanguage === lang.code
                                ? "text-white"
                                : "text-nightshade"
                            }`}
                          >
                            {lang.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Target Languages Selection */}
                <View>
                  <Text className="text-coolGray text-sm mb-3 font-semibold">
                    Learning Languages (Select multiple)
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {availableTargetLanguages.map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        onPress={() => toggleTargetLanguage(lang.code)}
                        className={`px-4 py-2 rounded-lg border-2 ${
                          selectedTargetLanguages.includes(lang.code)
                            ? "bg-vibrantCoral border-vibrantCoral"
                            : "bg-white border-coolGray"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            selectedTargetLanguages.includes(lang.code)
                              ? "text-white"
                              : "text-nightshade"
                          }`}
                        >
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </KeyboardAvoidingView>
            ) : (
              <>
                {profile.native_language && (
                  <View className="mb-3">
                    <Text className="text-coolGray text-sm mb-1">
                      Native Language
                    </Text>
                    <Text className="text-nightshade font-semibold">
                      {getLanguageName(profile.native_language)}
                    </Text>
                  </View>
                )}
                {profile.target_languages &&
                  profile.target_languages.length > 0 && (
                    <View>
                      <Text className="text-coolGray text-sm mb-1">
                        Learning
                      </Text>
                      <Text className="text-nightshade font-semibold">
                        {profile.target_languages
                          .map(getLanguageName)
                          .join(", ")}
                      </Text>
                    </View>
                  )}
              </>
            )}
          </View>
        )}

        {/* Posts Grid */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-nightshade">Posts</Text>
            <Text className="text-coolGray text-sm">{posts.length} posts</Text>
          </View>
          {isLoadingPosts ? (
            <View className="py-12 items-center">
              <Text className="text-coolGray text-sm">Loading posts...</Text>
            </View>
          ) : (
            <PostGrid posts={posts} />
          )}
        </View>

        {/* Subscription Info */}
        <View className="mb-6">
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-coolGray/20">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-nightshade font-semibold">Subscription</Text>
              <Text className={`font-semibold ${
                (profile as any)?.subscription_plan === "premium" 
                  ? "text-vibrantCoral" 
                  : "text-coolGray"
              }`}>
                {(profile as any)?.subscription_plan === "premium" ? "Premium" : "Free"}
              </Text>
            </View>
            {(profile as any)?.subscription_plan === "free" ? (
              <TouchableOpacity
                onPress={() => navigation.navigate("Pricing")}
                className="bg-deepTeal rounded-lg px-4 py-2 mt-2"
              >
                <Text className="text-white text-center font-semibold">
                  Upgrade to Premium
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={async () => {
                  if (!session?.user?.id) return;
                  const { url, error } = await paymentService.createBillingPortalSession(session.user.id);
                  if (error || !url) {
                    Alert.alert("Error", "Failed to open billing portal");
                    return;
                  }
                  const canOpen = await Linking.canOpenURL(url);
                  if (canOpen) {
                    await Linking.openURL(url);
                  }
                }}
                className="bg-deepTeal rounded-lg px-4 py-2 mt-2"
              >
                <Text className="text-white text-center font-semibold">
                  Manage Subscription
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings Options */}
        <View className="mb-6">
          <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-coolGray/20 flex-row items-center justify-between">
            <Text className="text-nightshade font-semibold">Settings</Text>
            <Ionicons name="settings-outline" size={20} color="#9BA4B5" />
          </TouchableOpacity>
          <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-coolGray/20 flex-row items-center justify-between">
            <Text className="text-nightshade font-semibold">Edit Profile</Text>
            <Ionicons name="create-outline" size={20} color="#9BA4B5" />
          </TouchableOpacity>
          <TouchableOpacity className="bg-white rounded-xl p-4 shadow-sm border border-coolGray/20 flex-row items-center justify-between">
            <Text className="text-nightshade font-semibold">
              Help & Support
            </Text>
            <Ionicons name="help-circle-outline" size={20} color="#9BA4B5" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-vibrantCoral rounded-xl px-6 py-4 items-center shadow-lg mb-6"
        >
          <Text className="text-white text-lg font-bold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
