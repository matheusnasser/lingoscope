import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image, ScrollView, Text, TouchableOpacity, View, Alert, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { containsChinese } from "../../utils/pinyin";
import SpeakerButton from "../../components/audio/SpeakerButton";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { userService } from "../../services/user";
import { srsService } from "../../services/srs/srsService";
import { supabase } from "../../config/supabase";

type AnalysisResultScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;
type RouteParams = {
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

export default function AnalysisResultScreen() {
  const navigation = useNavigation<AnalysisResultScreenNavigationProp>();
  const route = useRoute();
  const { session } = useAuth();
  const { t } = useTranslation();
  const [targetLanguage, setTargetLanguage] = useState<string>("zh-CN");
  const [subscriptionPlan, setSubscriptionPlan] = useState<"free" | "premium">("free");
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const imageFadeAnim = useRef(new Animated.Value(0)).current;
  const foundPhraseScale = useRef(new Animated.Value(0)).current;
  
  const {
    imageUri,
    detectedObjectBase,
    detectedObjectTarget,
    detectedObjectTargetPinyin,
    contextSentence,
    contextSentencePinyin,
    contextFoundPhrase,
    examplePhrases,
    storagePath,
    pinyin, // Legacy field
  } = (route.params as RouteParams) || {};

  // Log analysis result for debugging
  useEffect(() => {
    console.log("=== ANALYSIS RESULT SCREEN DATA ===");
    console.log("Full route params:", JSON.stringify(route.params, null, 2));
    console.log("detectedObjectBase:", detectedObjectBase);
    console.log("detectedObjectTarget:", detectedObjectTarget);
    console.log("detectedObjectTargetPinyin:", detectedObjectTargetPinyin);
    console.log("contextSentence:", contextSentence);
    console.log("contextSentencePinyin:", contextSentencePinyin);
    console.log("contextFoundPhrase:", contextFoundPhrase);
    console.log("examplePhrases:", JSON.stringify(examplePhrases, null, 2));
    console.log("storagePath:", storagePath);
    console.log("imageUri:", imageUri);
    console.log("===================================");
  }, [route.params]);

  // Animate on mount
  useEffect(() => {
    // Image animation
    Animated.timing(imageFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Content animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Found phrase animation (if exists)
    if (contextFoundPhrase) {
      setTimeout(() => {
        Animated.spring(foundPhraseScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }, 800);
    }
  }, []);

  // Use detectedObjectTargetPinyin if available, fallback to pinyin for backward compatibility
  const objectPinyin = detectedObjectTargetPinyin || pinyin;

  // Get user's target language and subscription plan
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user?.id) {
        const profile = await userService.getUserProfile(session.user.id);
        if (profile?.target_languages && profile.target_languages.length > 0) {
          // Map language codes to TTS language codes
          const langMap: Record<string, string> = {
            zh: "zh-CN",
            en: "en-US",
            es: "es-ES",
            fr: "fr-FR",
            de: "de-DE",
            ja: "ja-JP",
            ko: "ko-KR",
          };
          const langCode = profile.target_languages[0];
          setTargetLanguage(langMap[langCode] || "zh-CN");
        }
        // Get subscription plan
        const plan = (profile as any)?.subscription_plan || "free";
        setSubscriptionPlan(plan);
      }
    };
    loadUserData();
  }, [session]);

  // Create review item and check challenges when analysis is complete
  useEffect(() => {
    const processAnalysisResult = async () => {
      if (!session?.user?.id || !detectedObjectTarget || !detectedObjectBase) return;

      try {
        // Try to find the post ID from storage path
        let postId: string | undefined;
        if (storagePath) {
          try {
            const { data: posts } = await supabase
              .from('user_posts')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('storage_path', storagePath)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (posts) {
              postId = posts.id;
            }
          } catch (error) {
            console.log('Could not find post ID:', error);
          }
        }

        // Create review item for SRS (scheduled for tomorrow)
        // Note: Database trigger will also create this automatically, but we keep this as fallback
        try {
          await srsService.createReviewItem(session.user.id, {
            postId: postId,
            vocabularyBase: detectedObjectBase,
            vocabularyTarget: detectedObjectTarget,
            vocabularyTargetPinyin: detectedObjectTargetPinyin,
            contextSentence: contextSentence,
            contextSentencePinyin: contextSentencePinyin,
            examplePhrases: examplePhrases,
            imageUrl: imageUri,
          });
        } catch (error: any) {
          // Ignore duplicate errors (trigger may have already created it)
          if (error?.code !== '23505') {
            console.error('Error creating review item:', error);
          }
        }

      } catch (error) {
        console.error('Error processing analysis result:', error);
      }
    };

    // Small delay to ensure analysis result is fully loaded
    const timer = setTimeout(() => {
      processAnalysisResult();
    }, 500);

    return () => clearTimeout(timer);
  }, [session, detectedObjectTarget, detectedObjectBase, contextSentence, storagePath, imageUri]);

  const handleBack = () => {
    // Navigate to Home feed instead of going back
    navigation.navigate("Home");
  };

  const handleNewCapture = () => {
    navigation.navigate("Home");
  };

  const handleDelete = async () => {
    Alert.alert(
      t("analysis.deleteTitle", "Delete Result"),
      t("analysis.deleteConfirm", "Are you sure you want to delete this result? This action cannot be undone."),
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete", "Delete"),
          style: "destructive",
          onPress: async () => {
            try {
              // Find the post associated with this result
              if (!session?.user?.id || !storagePath) {
                navigation.navigate("Home");
                return;
              }

              // Soft delete the post by setting is_deleted to true
              // First find the post
              const { data: posts } = await supabase
                .from('user_posts')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('storage_path', storagePath)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              if (posts?.id) {
                // Update the post to be soft deleted
                const { error: postError } = await supabase
                  .from('user_posts')
                  .update({ is_deleted: true })
                  .eq('id', posts.id);

                if (postError) throw postError;

                // Also soft delete associated review items
                const { error: reviewError } = await supabase
                  .from('review_items')
                  .update({ is_deleted: true })
                  .eq('post_id', posts.id);
                  
                if (reviewError) throw reviewError;
              }
              
              navigation.navigate("Home");
            } catch (error) {
              console.error("Error deleting result:", error);
              Alert.alert(t("common.error"), t("analysis.deleteError", "Failed to delete result"));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-deepTeal mb-2">
            {t("analysis.title")}
          </Text>
          <Text className="text-coolGray text-base">
            {t("analysis.subtitle")}
          </Text>
        </View>

        {/* Image */}
        {imageUri && (
          <Animated.View
            className="px-6 mb-6"
            style={{
              opacity: imageFadeAnim,
              transform: [
                {
                  scale: imageFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            }}
          >
            <Image
              source={{ uri: imageUri }}
              className="w-full rounded-xl"
              style={{ aspectRatio: 1, resizeMode: "cover" }}
            />
          </Animated.View>
        )}

        {/* Detected Object */}
        <Animated.View
          className="px-6 mb-6"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View className="bg-white rounded-xl p-6 shadow-sm border border-coolGray/20">
            <Text className="text-coolGray text-sm mb-2">{t("analysis.detectedObject")}</Text>
            <View className="mb-2">
              <View className="flex-row items-baseline flex-wrap">
                <Text className="text-2xl font-bold text-nightshade mr-2">
                  {detectedObjectTarget}
                </Text>
                {detectedObjectTarget && (
                  <SpeakerButton text={detectedObjectTarget} size={22} />
                )}
                {objectPinyin && containsChinese(detectedObjectTarget) && (
                  <Text className="text-base text-coolGray italic">
                    ({objectPinyin})
                  </Text>
                )}
              </View>
              <Text className="text-lg text-coolGray mt-1">
                ({detectedObjectBase})
              </Text>
            </View>
            <View className="h-px bg-coolGray/20 my-4" />
            <View>
              <View className="flex-row items-start flex-wrap mb-2">
                <Text className="text-nightshade text-base leading-6 flex-1">
                  {contextSentence}
                </Text>
                {contextSentence && (
                  <SpeakerButton text={contextSentence} size={20} />
                )}
              </View>
              {/* Show found phrase if available (phrase found on the picture) */}
              {contextFoundPhrase && (
                <Animated.View
                  className="mt-3 mb-2"
                  style={{
                    transform: [{ scale: foundPhraseScale }],
                    opacity: foundPhraseScale,
                  }}
                >
                  <View
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: "#0F4C5C",
                      shadowColor: "#0F4C5C",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <View
                        className="rounded-full p-1.5 mr-2"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                      >
                        <Ionicons name="eye" size={16} color="#ffffff" />
                      </View>
                      <Text className="text-white text-xs font-bold uppercase tracking-wide">
                        Found on image
                      </Text>
                    </View>
                    <Text className="text-white text-base font-semibold leading-6">
                      {contextFoundPhrase}
                    </Text>
                  </View>
                </Animated.View>
              )}
              {/* Show base translation if available */}
              {detectedObjectBase && !contextFoundPhrase && (
                <Text className="text-coolGray text-sm mt-1 mb-1">
                  ({detectedObjectBase})
                </Text>
              )}
              {contextSentencePinyin && containsChinese(contextSentence) && (
                <Text className="text-coolGray text-sm italic mt-1">
                  {contextSentencePinyin}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Example Phrases - Premium Only */}
        {subscriptionPlan === "premium" ? (
          <Animated.View
            className="px-6 mb-6"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text className="text-xl font-bold text-nightshade mb-4">
              {t("analysis.examplePhrases")}
            </Text>
            {examplePhrases && examplePhrases.length > 0 ? (
              <View className="gap-3">
                {examplePhrases.map((phrase, index) => (
                  <View
                    key={index}
                    className="bg-white rounded-xl p-5 shadow-sm border border-coolGray/20"
                  >
                    <View className="mb-2">
                      <View className="flex-row items-start flex-wrap">
                        <Text className="text-nightshade font-semibold text-base flex-1">
                          {phrase.target}
                        </Text>
                        {phrase.target && (
                          <SpeakerButton text={phrase.target} size={20} />
                        )}
                      </View>
                      {/* Show base translation on top of pinyin */}
                      {phrase.base && (
                        <Text className="text-coolGray text-sm mt-1">
                          {phrase.base}
                        </Text>
                      )}
                      {phrase.targetPinyin && containsChinese(phrase.target) && (
                        <Text className="text-coolGray text-sm italic mt-1">
                          {phrase.targetPinyin}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-coolGray">No example phrases available</Text>
            )}
          </Animated.View>
        ) : (
          <Animated.View
            className="px-6 mb-6"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View className="rounded-xl p-6 border border-coolGray/20" style={{ backgroundColor: "#0F4C5C" }}>
              <Text className="text-white text-xl font-bold mb-2">
                {t("analysis.unlockExamplePhrases")}
              </Text>
              <Text className="text-white/90 text-base mb-4">
                {t("analysis.unlockDescription")}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Pricing")}
                className="bg-white rounded-lg px-6 py-3 items-center"
              >
                <Text className="text-deepTeal font-semibold text-base">
                  {t("analysis.viewPlans")}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <Animated.View
          className="px-6 gap-3"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <TouchableOpacity
            onPress={handleNewCapture}
            className="bg-vibrantCoral rounded-xl px-6 py-5 items-center shadow-lg"
          >
            <Text className="text-white text-lg font-bold">
              {t("analysis.captureAnother")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBack}
            className="bg-white border-2 border-coolGray rounded-xl px-6 py-5 items-center"
          >
            <Text className="text-nightshade text-lg font-semibold">{t("common.back")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="bg-red-50 rounded-xl px-6 py-4 items-center mt-2 mb-6 border border-red-100"
          >
            <Text className="text-red-500 text-base font-semibold">
              {t("common.delete", "Delete Result")}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
