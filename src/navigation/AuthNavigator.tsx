import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "./AppNavigator";

type AuthNavigatorProps = {
  children: React.ReactNode;
};

/**
 * Component that handles navigation based on auth and onboarding status
 */
export function AuthNavigator({ children }: AuthNavigatorProps) {
  const { session, loading, onboardingCompleted } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      // Not logged in - navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
      return;
    }

    // User is logged in
    if (onboardingCompleted === false) {
      // Check if username exists, if not go to username screen first
      const checkUsername = async () => {
        const { supabase } = await import("../config/supabase");
        const { data } = await supabase
          .from("user_profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();
        
        if (!data?.username) {
          navigation.navigate("OnboardingUsername");
        } else {
          navigation.navigate("OnboardingNativeLanguage");
        }
      };
      checkUsername();
    } else if (onboardingCompleted === true) {
      // Completed onboarding - navigate to home
      navigation.navigate("Home");
    }
  }, [session, loading, onboardingCompleted, navigation]);

  return <>{children}</>;
}

