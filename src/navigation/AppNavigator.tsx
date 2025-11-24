import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AnalysisResultScreen from "../screens/AnalysisResultScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/HomeScreen/ProfileScreen";
import LoginScreen from "../screens/LoginScreen";
import NativeLanguageScreen from "../screens/OnboardingScreen/NativeLanguageScreen";
import TargetLanguageScreen from "../screens/OnboardingScreen/TargetLanguageScreen";
import SignUpScreen from "../screens/SignUpScreen";

import { NavigatorScreenParams } from "@react-navigation/native";
import { HomeTabsParamList } from "./HomeTabsNavigator";

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  OnboardingNativeLanguage: undefined;
  OnboardingTargetLanguage: { nativeLanguage: string };
  Home: NavigatorScreenParams<HomeTabsParamList> | undefined;
  Profile: undefined;
  AnalysisResult: {
    imageUri: string;
    detectedObjectBase: string;
    detectedObjectTarget: string;
    detectedObjectTargetPinyin?: string;
    contextSentence: string;
    contextSentencePinyin?: string;
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
  { name: "OnboardingNativeLanguage", component: NativeLanguageScreen },
  { name: "OnboardingTargetLanguage", component: TargetLanguageScreen },
  { name: "Home", component: HomeScreen },
  { name: "Profile", component: ProfileScreen },
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
