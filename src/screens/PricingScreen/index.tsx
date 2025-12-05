import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../config/supabase";
import { paymentService } from "../../services/payment/paymentService";

type PricingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: {
    daily_challenges: number;
    example_phrases: boolean;
    unlimited_captures: boolean;
    priority_support?: boolean;
  };
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      daily_challenges: 3,
      example_phrases: false,
      unlimited_captures: true,
    },
  },
  {
    id: "premium",
    name: "Premium",
    description: "Unlock your full learning potential",
    priceMonthly: 9.99,
    priceYearly: 99.99,
    features: {
      daily_challenges: 10,
      example_phrases: true,
      unlimited_captures: true,
      priority_support: true,
    },
  },
];

export default function PricingScreen() {
  const navigation = useNavigation<PricingScreenNavigationProp>();
  const { session } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>("premium");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCurrentPlan = async () => {
      if (session?.user?.id) {
        const { data } = await supabase
          .from("user_profiles")
          .select("subscription_plan")
          .eq("id", session.user.id)
          .single();
        
        if (data) {
          setCurrentPlan(data.subscription_plan);
        }
      }
    };
    loadCurrentPlan();
  }, [session]);

  const handleSubscribe = async () => {
    if (!session?.user?.id) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    if (selectedPlan === "free") {
      // Switch to free plan
      try {
        setIsLoading(true);
        await supabase
          .from("user_profiles")
          .update({ subscription_plan: "free" })
          .eq("id", session.user.id);
        
        Alert.alert("Success", "Switched to free plan");
        navigation.goBack();
      } catch (error) {
        Alert.alert("Error", "Failed to switch plan");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Create Stripe checkout session
    setIsLoading(true);
    try {
      const { url, error } = await paymentService.createCheckoutSession({
        userId: session.user.id,
        planId: "premium",
        billingCycle,
      });

      if (error || !url) {
        Alert.alert("Error", error?.message || "Failed to create checkout session");
        return;
      }

      // Open Stripe checkout URL
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open payment link");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const freePlan = PLANS.find((p) => p.id === "free")!;
  const premiumPlan = PLANS.find((p) => p.id === "premium")!;

  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mb-4"
          >
            <Ionicons name="arrow-back" size={24} color="#0F4C5C" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-deepTeal mb-2">
            Choose Your Plan
          </Text>
          <Text className="text-coolGray text-base">
            Unlock more features to accelerate your learning
          </Text>
        </View>

        {/* Billing Toggle */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-xl p-1 flex-row border border-coolGray/20">
            <TouchableOpacity
              onPress={() => setBillingCycle("monthly")}
              className={`flex-1 py-3 rounded-lg ${
                billingCycle === "monthly" ? "bg-deepTeal" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  billingCycle === "monthly" ? "text-white" : "text-nightshade"
                }`}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBillingCycle("yearly")}
              className={`flex-1 py-3 rounded-lg ${
                billingCycle === "yearly" ? "bg-deepTeal" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  billingCycle === "yearly" ? "text-white" : "text-nightshade"
                }`}
              >
                Yearly
                <Text className="text-xs"> (Save 17%)</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans */}
        <View className="px-6 gap-4">
          {/* Free Plan */}
          <TouchableOpacity
            onPress={() => setSelectedPlan("free")}
            className={`bg-white rounded-xl p-6 border-2 ${
              selectedPlan === "free"
                ? "border-deepTeal"
                : "border-coolGray/20"
            }`}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-2xl font-bold text-nightshade">
                  {freePlan.name}
                </Text>
                <Text className="text-coolGray text-sm mt-1">
                  {freePlan.description}
                </Text>
              </View>
              {selectedPlan === "free" && (
                <View className="w-6 h-6 rounded-full bg-deepTeal items-center justify-center">
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text className="text-3xl font-bold text-nightshade mb-4">
              $0<Text className="text-lg text-coolGray">/month</Text>
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#0F4C5C" />
                <Text className="text-nightshade ml-2">
                  {freePlan.features.daily_challenges} daily challenges
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#0F4C5C" />
                <Text className="text-nightshade ml-2">Unlimited captures</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="close-circle" size={20} color="#9BA4B5" />
                <Text className="text-coolGray ml-2">Example phrases</Text>
              </View>
            </View>
            {currentPlan === "free" && (
              <View className="mt-4 bg-coolGray/20 rounded-lg py-2">
                <Text className="text-center text-coolGray font-semibold">
                  Current Plan
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Premium Plan */}
          <TouchableOpacity
            onPress={() => setSelectedPlan("premium")}
            className={`rounded-xl p-6 border-2 ${
              selectedPlan === "premium"
                ? "border-deepTeal bg-deepTeal"
                : "border-coolGray/20 bg-white"
            }`}
            style={{
              backgroundColor: selectedPlan === "premium" ? "#0F4C5C" : "#FFFFFF",
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-2xl font-bold text-white">
                  {premiumPlan.name}
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  {premiumPlan.description}
                </Text>
              </View>
              {selectedPlan === "premium" && (
                <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                  <Ionicons name="checkmark" size={16} color="#0F4C5C" />
                </View>
              )}
            </View>
            <Text className="text-3xl font-bold text-white mb-4">
              ${billingCycle === "monthly" ? premiumPlan.priceMonthly : premiumPlan.priceYearly}
              <Text className="text-lg text-white/80">/{billingCycle === "monthly" ? "month" : "year"}</Text>
            </Text>
            <View className="gap-2">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text className="text-white ml-2">
                  {premiumPlan.features.daily_challenges} daily challenges
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text className="text-white ml-2">Unlimited captures</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text className="text-white ml-2">Example phrases</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text className="text-white ml-2">Priority support</Text>
              </View>
            </View>
            {currentPlan === "premium" && (
              <View className="mt-4 bg-white/20 rounded-lg py-2">
                <Text className="text-center text-white font-semibold">
                  Current Plan
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Subscribe Button */}
        <View className="px-6 mt-6">
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={isLoading}
            className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {selectedPlan === "free" ? "Continue with Free" : `Subscribe to ${premiumPlan.name}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

