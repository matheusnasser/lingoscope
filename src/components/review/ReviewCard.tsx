import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ReviewGrade, ReviewItem } from "../../services/srs/srsService";
import { storageService } from "../../services/storage/storageService";
import { containsChinese } from "../../utils/pinyin";
import SpeakerButton from "../audio/SpeakerButton";

interface ReviewCardProps {
  item: ReviewItem;
  onGrade: (itemId: string, grade: ReviewGrade) => Promise<void>;
  isProcessing: boolean;
}

export default function ReviewCard({
  item,
  onGrade,
  isProcessing,
}: ReviewCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [contextSentenceBase, setContextSentenceBase] = useState<string | null>(
    null
  );

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadImageAndContext();
  }, [item]);

  useEffect(() => {
    // Reset when item changes
    setIsRevealed(false);
    flipAnim.setValue(0);
  }, [item.id]);

  useEffect(() => {
    // Animate flip when revealed
    Animated.spring(flipAnim, {
      toValue: isRevealed ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isRevealed]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  const loadImageAndContext = async () => {
    // Get image URL
    if (item.image_url) {
      setImageUrl(item.image_url);
    } else if (item.post_id) {
      try {
        const post = await storageService.getPostById(item.post_id);
        if (post?.url) {
          setImageUrl(post.url);
        }
      } catch (error) {
        console.error("Error fetching post image:", error);
      }
    }

    // Get base language context sentence
    if (item.post_id && item.context_sentence) {
      try {
        const post = await storageService.getPostById(item.post_id);
        if (post?.example_phrases && post.example_phrases.length > 0) {
          const matchingPhrase = post.example_phrases.find(
            (phrase) => phrase.target === item.context_sentence
          );
          if (matchingPhrase?.base) {
            setContextSentenceBase(matchingPhrase.base);
          } else if (post.context_found_phrase) {
            setContextSentenceBase(post.context_found_phrase);
          }
        } else if (post?.context_found_phrase) {
          setContextSentenceBase(post.context_found_phrase);
        }
      } catch (error) {
        console.error("Error fetching context sentence base:", error);
      }
    }
  };

  const handleGrade = async (grade: ReviewGrade) => {
    await onGrade(item.id, grade);
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Front of card (Question) */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          frontAnimatedStyle,
          {
            opacity: flipAnim.interpolate({
              inputRange: [0, 90],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <View style={styles.cardInner}>
          {/* Image Section */}
          <View style={styles.topSection}>
            {imageUrl ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={64} color="#8B7355" />
                </View>
              </View>
            )}
          </View>

          {/* Question Text */}
          <View style={styles.contentSection}>
            <Text style={styles.questionLabel}>Translate this:</Text>
            <Text style={styles.questionText}>{item.vocabulary_base}</Text>
            {item.context_sentence && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText} numberOfLines={2}>
                  "{item.context_sentence}"
                </Text>
                {contextSentenceBase && (
                  <Text style={styles.hintTextBase} numberOfLines={2}>
                    "{contextSentenceBase}"
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Reveal Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              onPress={handleReveal}
              style={styles.revealButton}
              activeOpacity={0.8}
            >
              <Text style={styles.revealButtonText}>Reveal Answer</Text>
              <Ionicons name="chevron-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Back of card (Answer) */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          backAnimatedStyle,
          {
            opacity: flipAnim.interpolate({
              inputRange: [90, 180],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <View style={styles.cardInner}>
          {/* Header */}
          <View style={styles.backHeader}>
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.baseTextSmall}>{item.vocabulary_base}</Text>
            </View>
          </View>

          {/* Answer Content */}
          <View style={styles.answerContent}>
            <View style={styles.answerRow}>
              <Text style={styles.answerText}>{item.vocabulary_target}</Text>
              <SpeakerButton text={item.vocabulary_target} size={24} />
            </View>

            {item.vocabulary_target_pinyin &&
              containsChinese(item.vocabulary_target) && (
                <Text style={styles.pinyinText}>
                  /{item.vocabulary_target_pinyin}/
                </Text>
              )}

            <View style={styles.divider} />

            {/* Context Sentence */}
            {item.context_sentence && (
              <View style={styles.contextContainer}>
                <View style={styles.contextRow}>
                  <Text style={styles.contextText}>
                    {item.context_sentence}
                  </Text>
                  <SpeakerButton text={item.context_sentence} size={18} />
                </View>
                {contextSentenceBase && (
                  <Text style={styles.contextTextBase}>
                    {contextSentenceBase}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Grade Buttons */}
          <View style={styles.gradeContainer}>
            <Text style={styles.gradePrompt}>How well did you know this?</Text>
            <View style={styles.gradeButtonsRow}>
              <GradeButton
                type="again"
                label="Again"
                time="< 1m"
                onPress={() => handleGrade("again")}
                disabled={isProcessing}
              />
              <GradeButton
                type="hard"
                label="Hard"
                time="1d"
                onPress={() => handleGrade("hard")}
                disabled={isProcessing}
              />
              <GradeButton
                type="good"
                label="Good"
                time="3d"
                onPress={() => handleGrade("good")}
                disabled={isProcessing}
              />
              <GradeButton
                type="easy"
                label="Easy"
                time="7d"
                onPress={() => handleGrade("easy")}
                disabled={isProcessing}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// Grade Button Component
interface GradeButtonProps {
  type: ReviewGrade;
  label: string;
  time: string;
  onPress: () => void;
  disabled: boolean;
}

const GradeButton = ({
  type,
  label,
  time,
  onPress,
  disabled,
}: GradeButtonProps) => {
  const getColors = () => {
  switch (type) {
    case "again":
        return {
          bg: "#FEF2F2",
          border: "#FECACA",
          text: "#DC2626",
          icon: "close-circle",
        };
    case "hard":
        return {
          bg: "#FFF7ED",
          border: "#FED7AA",
          text: "#EA580C",
          icon: "remove-circle",
        };
    case "good":
        return {
          bg: "#EFF6FF",
          border: "#BFDBFE",
          text: "#2563EB",
          icon: "checkmark-circle",
        };
    case "easy":
        return {
          bg: "#F0FDF4",
          border: "#BBF7D0",
          text: "#16A34A",
          icon: "checkmark-done-circle",
        };
    }
  };

  const colors = getColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.gradeButton,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      activeOpacity={0.7}
    >
      <Ionicons name={colors.icon as any} size={20} color={colors.text} />
      <Text style={[styles.gradeButtonLabel, { color: colors.text }]}>
        {label}
      </Text>
      <Text style={[styles.gradeButtonTime, { color: colors.text }]}>
        {time}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    height: "100%",
  },
  card: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backfaceVisibility: "hidden",
  },
  cardFront: {
    backgroundColor: "#FFFFFF",
  },
  cardBack: {
    backgroundColor: "#FFFFFF",
  },
  cardInner: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  topSection: {
    height: "45%",
    backgroundColor: "#F9FAFB",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  questionLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  hintContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    width: "100%",
  },
  hintText: {
    fontSize: 14,
    color: "#4B5563",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 4,
  },
  hintTextBase: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  revealButton: {
    backgroundColor: "#0F4C5C",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F4C5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  revealButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  backHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  thumbnailImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  baseTextSmall: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  answerContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  answerText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1F2937",
    marginRight: 12,
  },
  pinyinText: {
    fontSize: 18,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 16,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 20,
  },
  contextContainer: {
    width: "100%",
    marginBottom: 20,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contextText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  contextTextBase: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  gradeContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  gradePrompt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
  },
  gradeButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  gradeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeButtonLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  gradeButtonTime: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
});
