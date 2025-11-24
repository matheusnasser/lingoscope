import { View, Text, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { userService, UserProfile } from "../../services/user";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";

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

type HomeHeaderNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeHeader() {
  const { session } = useAuth();
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      userService.getUserProfile(session.user.id).then((profile) => {
        setProfile(profile);
      });
    }
  }, [session]);

  const handleSettingsPress = () => {
    navigation.navigate("Profile");
  };

  const getLanguageName = (code: string) => LANGUAGE_NAMES[code] || code;

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.charAt(0).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return null;
  };

  const getUserDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    if (session?.user?.email) {
      return session.user.email.split("@")[0];
    }
    return "User";
  };

  return (
    <SafeAreaView edges={["top"]} className="bg-white border-b border-coolGray/20 shadow-sm">
      <View className="px-6 py-4 flex-row items-center justify-between">
        {/* Left: Profile Picture and Language Info */}
        <View className="flex-row items-center flex-1">
          {/* Profile Picture */}
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              className="w-12 h-12 rounded-full mr-3"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-deepTeal items-center justify-center mr-3 shadow-sm">
              {getInitials() ? (
                <Text className="text-white text-lg font-bold">
                  {getInitials()}
                </Text>
              ) : (
                <Ionicons name="person" size={20} color="#FFFFFF" />
              )}
            </View>
          )}

          {/* Language Information */}
          <View className="flex-1">
            {profile?.native_language && (
              <Text className="text-nightshade text-base font-bold" numberOfLines={1}>
                {getLanguageName(profile.native_language)} →{" "}
                {profile.target_languages && profile.target_languages.length > 0
                  ? profile.target_languages.map(getLanguageName).join(", ")
                  : "Select languages"}
              </Text>
            )}
            <Text className="text-coolGray text-xs mt-0.5" numberOfLines={1}>
              {getUserDisplayName()}
            </Text>
          </View>
        </View>

        {/* Right: Settings/Profile Button */}
        <TouchableOpacity 
          onPress={handleSettingsPress}
          className="ml-4 p-2"
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#9BA4B5" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

