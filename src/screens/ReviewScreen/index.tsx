import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReviewCard from "../../components/review/ReviewCard";
import { useAuth } from "../../context/AuthContext";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { premiumService } from "../../services/premium/premiumService";
import {
  ReviewGrade,
  ReviewItem,
  srsService,
} from "../../services/srs/srsService";
import {
  vocabularyService,
  VocabularySuggestion,
} from "../../services/vocabulary/vocabularyService";

type ReviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FREE_DAILY_REVIEW_LIMIT = 10;

export default function ReviewScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<ReviewScreenNavigationProp>();
  const [currentItem, setCurrentItem] = useState<ReviewItem | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<VocabularySuggestion[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      initializeReviews();
      checkPremiumStatus();
    }, [session])
  );

  const initializeReviews = async () => {
    if (!session?.user?.id) return;

    // Create review items from existing photos that don't have review items yet
    await srsService.createReviewItemsFromExistingPosts(session.user.id);

    // Load the next review
    await loadNextReview();
  };

  const checkPremiumStatus = async () => {
    if (session?.user?.id) {
      const premium = await premiumService.isPremium(session.user.id);
      setIsPremium(premium);
    }
  };

  const loadNextReview = async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Get due reviews
      const dueReviews = await srsService.getDueReviews(session.user.id);

      // Apply limit for free users
      const limitedReviews = isPremium
        ? dueReviews
        : dueReviews.slice(0, FREE_DAILY_REVIEW_LIMIT);

      setReviewCount(
        isPremium
          ? dueReviews.length
          : Math.min(dueReviews.length, FREE_DAILY_REVIEW_LIMIT)
      );

      if (limitedReviews.length === 0) {
        setCurrentItem(null);
        setReviewItems([]);
        setIsLoading(false);
        return;
      }

      // Set the first item as current
      const item = limitedReviews[0];
      setCurrentItem(item);
      setReviewItems(limitedReviews.slice(1)); // Keep rest for batch mode if needed
    } catch (error) {
      console.error("Error loading review:", error);
      Alert.alert("Error", "Failed to load review");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = async (itemId: string, grade: ReviewGrade) => {
    if (!session?.user?.id) return;

    setIsProcessing(true);
    try {
      const updated = await srsService.processReview(itemId, grade);

      if (updated) {
        // Remove current item and load next
        const remainingItems = reviewItems.filter((item) => item.id !== itemId);

        if (remainingItems.length > 0) {
          // Set next item as current
          setCurrentItem(remainingItems[0]);
          setReviewItems(remainingItems.slice(1));
        } else {
          // Load more reviews
          await loadNextReview();
        }
      }
    } catch (error) {
      console.error("Error processing review:", error);
      Alert.alert("Error", "Failed to process review");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!session?.user?.id) return;

    setIsGenerating(true);
    try {
      const response = await vocabularyService.generateSuggestions();
      if (response.success && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
        setShowSuggestions(true);
      } else {
        Alert.alert(
          "No Suggestions",
          response.error ||
            "Could not generate suggestions. Try capturing more photos first!"
        );
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      Alert.alert("Error", "Failed to generate suggestions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateReviewFromSuggestion = async (
    suggestion: VocabularySuggestion
  ) => {
    if (!session?.user?.id) return;

    setIsProcessing(true);
    try {
      await srsService.createReviewItem(session.user.id, {
        vocabularyBase: suggestion.base,
        vocabularyTarget: suggestion.target,
        vocabularyTargetPinyin: suggestion.pinyin || undefined,
        contextSentence: suggestion.contextSentence,
        imageUrl: undefined,
      });

      setSuggestions((prev) =>
        prev.filter((s) => s.target !== suggestion.target)
      );

      if (suggestions.length === 1) {
        setShowSuggestions(false);
      }

      await initializeReviews();
    } catch (error) {
      console.error("Error creating review from suggestion:", error);
      Alert.alert("Error", "Failed to create review");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReReviewWords = async () => {
    if (!session?.user?.id) return;

    setIsProcessing(true);
    try {
      const allItems = await srsService.getAllReviewItems(session.user.id);
      const itemsWithImages = allItems.filter(
        (item) => item.image_url || item.post_id
      );

      if (itemsWithImages.length === 0) {
        Alert.alert(
          "No Words Available",
          "You need to capture photos first before you can re-review words."
        );
        setIsProcessing(false);
        return;
      }

      const { supabase } = await import("../../config/supabase");
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("review_items")
        .update({ next_review_at: now })
        .in(
          "id",
          itemsWithImages.map((item) => item.id)
        );

      if (error) throw error;

      await initializeReviews();

      Alert.alert(
        "Words Reset!",
        `${itemsWithImages.length} words are now ready for review.`
      );
    } catch (error) {
      console.error("Error re-reviewing words:", error);
      Alert.alert("Error", "Failed to reset reviews");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-offWhite">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F4C5C" />
          <Text className="text-coolGray text-sm mt-4">Loading cards...</Text>
        </View>
      </View>
    );
  }

  // Empty State (All Caught Up)
  if (!currentItem && reviewItems.length === 0) {
    return (
      <View className="flex-1 bg-offWhite">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
          <View className="flex-1 items-center justify-center px-8 py-12">
            <View className="w-24 h-24 bg-teal-50 rounded-full items-center justify-center mb-6">
              <Ionicons name="checkmark-done" size={48} color="#0F4C5C" />
            </View>

            <Text className="text-3xl font-bold text-nightshade mb-3 text-center">
              All Caught Up!
            </Text>
            <Text className="text-coolGray text-lg text-center mb-10 leading-6">
              Great job! You've completed all your reviews for today.
            </Text>

            {/* Action Buttons */}
            <View className="w-full gap-4">
              <TouchableOpacity
                onPress={handleGenerateSuggestions}
                disabled={isGenerating}
                className="bg-deepTeal rounded-2xl py-4 flex-row items-center justify-center shadow-lg shadow-teal-900/20"
                style={{ opacity: isGenerating ? 0.8 : 1 }}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="sparkles" size={20} color="#ffffff" />
                )}
                <Text className="text-white font-bold text-lg ml-3">
                  Discover New Words
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReReviewWords}
                disabled={isProcessing}
                className="bg-white border-2 border-deepTeal/10 rounded-2xl py-4 flex-row items-center justify-center"
                style={{ opacity: isProcessing ? 0.8 : 1 }}
              >
                <Ionicons name="refresh" size={20} color="#0F4C5C" />
                <Text className="text-deepTeal font-bold text-lg ml-3">
                  Review Again
                </Text>
              </TouchableOpacity>
            </View>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <View className="w-full mt-8">
                <Text className="text-lg font-bold text-nightshade mb-4">
                  Suggested Words
                </Text>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleCreateReviewFromSuggestion(suggestion)}
                    className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
                  >
                    <Text className="text-nightshade font-semibold text-base">
                      {suggestion.base}
                    </Text>
                    <Text className="text-coolGray text-sm mt-1">
                      {suggestion.target}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-offWhite">
      <StatusBar barStyle="dark-content" />

      {/* Header with Progress */}
      <View className="px-6 py-2 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-nightshade">Review</Text>
          {reviewCount > 0 && (
            <View className="bg-deepTeal/10 px-3 py-1 rounded-full">
              <Text className="text-deepTeal font-semibold text-sm">
                {reviewCount} {reviewCount === 1 ? "card" : "cards"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Review Card Container */}
      <View className="flex-1 px-6 py-6">
        {currentItem && (
          <ReviewCard
            key={currentItem.id}
            item={currentItem}
            onGrade={handleGrade}
            isProcessing={isProcessing}
          />
        )}
      </View>
    </View>
  );
}
