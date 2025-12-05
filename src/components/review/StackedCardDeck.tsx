import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ReviewCard from "./ReviewCard";
import { ReviewItem, ReviewGrade } from "../../services/srs/srsService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// Dynamic card dimensions based on screen size
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;
const SWIPE_THRESHOLD = 120;

interface StackedCardDeckProps {
  items: ReviewItem[];
  onGrade: (itemId: string, grade: ReviewGrade) => Promise<void>;
  isProcessing: boolean;
  onRecordingComplete?: (audioUri: string) => Promise<void> | void;
}

export default function StackedCardDeck({
  items,
  onGrade,
  isProcessing,
  onRecordingComplete,
}: StackedCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const handleCardComplete = async () => {
    // Animate card out
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x: SCREEN_WIDTH * 1.2, y: -100 }, // Fly out to right/top
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next card
      setCurrentIndex((prev) => prev + 1);
      position.setValue({ x: 0, y: 0 });
      scale.setValue(1);
      rotate.setValue(0);
    });
  };

  const handleGrade = async (itemId: string, grade: ReviewGrade) => {
    await onGrade(itemId, grade);
    await handleCardComplete();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessing,
      onMoveShouldSetPanResponder: () => !isProcessing,
      onPanResponderMove: (evt, gestureState) => {
        if (!isProcessing) {
          position.setValue({ x: gestureState.dx, y: gestureState.dy });
          // Rotate based on x position
          rotate.setValue(gestureState.dx / 20);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isProcessing) return;

        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          // Swipe detected - remove card
          const direction = gestureState.dx > 0 ? 1 : -1;
          Animated.parallel([
            Animated.timing(position, {
              toValue: {
                x: direction * (SCREEN_WIDTH + 100),
                y: gestureState.dy,
              },
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Move to next card
            setCurrentIndex((prev) => prev + 1);
            position.setValue({ x: 0, y: 0 });
            scale.setValue(1);
            rotate.setValue(0);
          });
        } else {
          // Return to original position
          Animated.parallel([
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              friction: 5,
            }),
            Animated.spring(rotate, {
              toValue: 0,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  if (items.length === 0 || currentIndex >= items.length) {
    return null;
  }

  const currentItem = items[currentIndex];
  // Show up to 2 cards behind
  const remainingCards = items.slice(currentIndex + 1, currentIndex + 3);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: 'clamp',
  });

  const animatedCardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: rotateInterpolate },
      { scale: scale },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={styles.deckContainer}>
        {/* Background cards (stacked behind) */}
        {remainingCards.reverse().map((item, index) => {
          // Reverse index so the last one is at the bottom
          const stackIndex = remainingCards.length - 1 - index;
          
          // Calculate appearance
          const cardScale = 1 - (stackIndex + 1) * 0.04;
          const cardTranslateY = (stackIndex + 1) * 12;
          const cardOpacity = 1 - (stackIndex + 1) * 0.3;

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.cardWrapper,
                {
                  transform: [
                    { scale: cardScale },
                    { translateY: cardTranslateY },
                  ],
                  opacity: cardOpacity,
                  zIndex: 10 - stackIndex,
                },
              ]}
            >
              <View style={styles.cardPlaceholder} />
            </Animated.View>
          );
        })}

        {/* Active card (on top) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            animatedCardStyle,
            { zIndex: 100 },
          ]}
          {...panResponder.panHandlers}
        >
          <ReviewCard
            item={currentItem}
            onGrade={handleGrade}
            isProcessing={isProcessing}
            onRecordingComplete={onRecordingComplete}
          />
        </Animated.View>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {items.length}
          </Text>
          <Text style={styles.progressLabel}>Cards Reviewed</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / items.length) * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between", // Distribute space
    paddingVertical: 20,
  },
  deckContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32, // Added margin to push deck down from header
    // Ensure the deck is centered and has space for the swipe gestures
  },
  cardWrapper: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  cardPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
    backgroundColor: "#F5F1E8",
    borderWidth: 1,
    borderColor: "#E8DDD0",
  },
  progressContainer: {
    width: "100%",
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F4C5C",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9BA4B5",
    marginBottom: 2,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0F4C5C",
    borderRadius: 3,
  },
});
