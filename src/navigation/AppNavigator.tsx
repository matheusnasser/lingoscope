import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AnalysisResultScreen from "../screens/AnalysisResultScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/HomeScreen/ProfileScreen";
import LoginScreen from "../screens/LoginScreen";
import NativeLanguageScreen from "../screens/OnboardingScreen/NativeLanguageScreen";
import TargetLanguageScreen from "../screens/OnboardingScreen/TargetLanguageScreen";
import UsernameScreen from "../screens/OnboardingScreen/UsernameScreen";
import ProficiencyScreen from "../screens/OnboardingScreen/ProficiencyScreen";
import GoalsScreen from "../screens/OnboardingScreen/GoalsScreen";
import InterestsScreen from "../screens/OnboardingScreen/InterestsScreen";
import PricingScreen from "../screens/PricingScreen";
import SignUpScreen from "../screens/SignUpScreen";

import { NavigatorScreenParams } from "@react-navigation/native";
import { HomeTabsParamList } from "./HomeTabsNavigator";

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Onboarding: { screen: "Username" | "NativeLanguage" | "TargetLanguage" | "Proficiency" | "Goals" | "Interests" } | undefined;
  OnboardingUsername: undefined;
  OnboardingNativeLanguage: undefined;
  OnboardingTargetLanguage: { nativeLanguage: string };
  OnboardingProficiency: { nativeLanguage: string; targetLanguage: string };
  OnboardingGoals: { nativeLanguage: string; targetLanguage: string; proficiencyLevel: string };
  OnboardingInterests: { nativeLanguage: string; targetLanguage: string; proficiencyLevel: string; learningGoals: string[] };
  Home: NavigatorScreenParams<HomeTabsParamList> | undefined;
  Profile: undefined;
  Pricing: undefined;
  AnalysisResult: {
    imageUri: string;
    detectedObjectBase: string;
    detectedObjectTarget: string;
    detectedObjectTargetPinyin?: string;
    contextSentence: string;
    contextSentencePinyin?: string;
    contextFoundPhrase?: string; // Phrase found on the picture in base language
    examplePhrases: Array<{
      base: string;
      target: string;
      targetPinyin?: string;
    }>;
    storagePath: string;
    pinyin?: string; // Legacy field
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const routes: {
  name: keyof RootStackParamList;
  component: React.ComponentType<any>;
}[] = [
  { name: "Login", component: LoginScreen },
  { name: "SignUp", component: SignUpScreen },
  { name: "OnboardingUsername", component: UsernameScreen },
  { name: "OnboardingNativeLanguage", component: NativeLanguageScreen },
  { name: "OnboardingTargetLanguage", component: TargetLanguageScreen },
  { name: "OnboardingProficiency", component: ProficiencyScreen },
  { name: "OnboardingGoals", component: GoalsScreen },
  { name: "OnboardingInterests", component: InterestsScreen },
  { name: "Home", component: HomeScreen },
  { name: "Profile", component: ProfileScreen },
  { name: "Pricing", component: PricingScreen },
  { name: "AnalysisResult", component: AnalysisResultScreen },
];

export const navigateTo = (name: keyof RootStackParamList) => {
  return routes.find((route) => route.name === name)?.name;
};

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      {routes.map((route) => (
        <Stack.Screen
          key={route.name}
          name={route.name}
          component={route.component}
          options={{
            headerShown: false,
          }}
        />
      ))}
    </Stack.Navigator>
  );
}
