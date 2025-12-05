import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AppState,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import CameraScreen from "../screens/HomeScreen/CameraScreen";
import DiscoverScreen from "../screens/HomeScreen/DiscoverScreen";
import ReviewScreen from "../screens/ReviewScreen/index";

// Wrapper components that redirect to Review if there are due reviews
function DiscoverScreenWithReviewCheck() {
  // Review check removed to prevent loop
  return <DiscoverScreen />;
}

function CameraScreenWithReviewCheck() {
  // Review check removed to prevent loop
  return <CameraScreen />;
}

export type HomeTabsParamList = {
  Discover: undefined;
  Camera: undefined;
  Review: undefined;
};

const Tab = createBottomTabNavigator<HomeTabsParamList>();

export default function HomeTabsNavigator() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const [initialRoute, setInitialRoute] =
    useState<keyof HomeTabsParamList>("Discover");

  useEffect(() => {
    // Removed aggressive redirection to Review screen
    setInitialRoute("Discover");
  }, [session]);

  // Check reviews when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "active" && session?.user?.id) {
          // Removed aggressive redirection to Review screen
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [session]);

  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#0F4C5C",
        tabBarInactiveTintColor: "#9BA4B5",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreenWithReviewCheck}
        options={{
          tabBarLabel: t("home.feed"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          tabBarLabel: "Review",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreenWithReviewCheck}
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size + 8} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...(props as TouchableOpacityProps)}
              style={{
                top: -15,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#1A1A2E",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Ionicons name="camera" size={28} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
