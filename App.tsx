import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";
import "./src/i18n"; // Initialize i18n
import { AuthProvider } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LanguageProvider>
          <NavigationContainer>
            <AuthNavigator>
              <AppNavigator />
            </AuthNavigator>
          </NavigationContainer>
        </LanguageProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
