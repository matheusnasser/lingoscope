import { NavigationContainer } from "@react-navigation/native";
import "./global.css";
import { AuthProvider } from "./src/context/AuthContext";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AuthNavigator>
          <AppNavigator />
        </AuthNavigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
