import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path, Defs, Pattern, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Animated component for framer-motion like behavior
const MotionView = ({ 
  style, 
  children, 
  delay = 0, 
  duration = 2000, 
  scaleRange = [1, 1.5, 1], 
  opacityRange = [0.3, 0, 0.3],
  rotate = false
}: any) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: duration,
          delay: delay * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 0, // Reset instantly
          useNativeDriver: true,
        })
      ])
    ).start();

    // Rotate animation if enabled
    if (rotate) {
      Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: undefined // linear
        })
      ).start();
    }
  }, []);

  const scale = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: scaleRange
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: opacityRange
  });

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const animatedStyle = {
    transform: [
      { scale },
      ...(rotate ? [{ rotate: rotation }] : [])
    ],
    opacity
  };

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export function AnalyzingScreen() {
  const [dots, setDots] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Dots animation
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 400);

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false, // Width property doesn't support native driver
    }).start();

    // Text fade-in slide-up animation
    Animated.timing(textAnim, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
    
    // Sparkle rotation
    Animated.loop(
        Animated.timing(iconRotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
        })
    ).start();

    return () => clearInterval(interval);
  }, []);

  const textTranslateY = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0]
  });

  const iconRotation = iconRotateAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '180deg', '360deg']
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient - Simulated with solid color for React Native, 
          or use react-native-linear-gradient if available. 
          Using styling for approximation. */}
      <View style={[StyleSheet.absoluteFill, styles.gradientBackground]} />

      {/* Animated Background Grid */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}>
        <Svg height="100%" width="100%">
          <Defs>
            <Pattern
              id="grid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <Path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="white"
                strokeOpacity="0.05"
                strokeWidth="1"
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grid)" />
        </Svg>
      </View>

      {/* Animated Scanning Effect */}
      <View style={styles.scannerContainer}>
        {/* Pulsing Circles with Modern Glow */}
        <MotionView
          style={styles.absoluteCenter}
          scaleRange={[1, 1.5, 1]}
          opacityRange={[0.3, 0, 0.3]}
          duration={2000}
        >
          <View style={[styles.circle, styles.circleLarge]} />
        </MotionView>

        <MotionView
          style={styles.absoluteCenter}
          scaleRange={[1, 1.3, 1]}
          opacityRange={[0.4, 0, 0.4]}
          duration={2000}
          delay={0.3}
        >
          <View style={[styles.circle, styles.circleMedium]} />
        </MotionView>

        <MotionView
          style={styles.absoluteCenter}
          scaleRange={[1, 1.2, 1]}
          opacityRange={[0.5, 0, 0.5]}
          duration={2000}
          delay={0.6}
        >
          <View style={[styles.circle, styles.circleSmall]} />
        </MotionView>

        {/* Center Icon with Glassmorphism */}
        <View style={styles.centerIconWrapper}>
            {/* Rotating glow ring */}
            <MotionView 
                style={styles.absoluteCenter}
                rotate={true}
                duration={3000}
            >
                <View style={styles.glowRing} />
            </MotionView>

          <View style={styles.glassIconContainer}>
            <Animated.View style={{ transform: [{ rotate: iconRotation }, { scale: 1.2 }] }}>
                <Ionicons name="sparkles" size={48} color="white" style={styles.sparkleIcon} />
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Status Text with Modern Typography */}
      <Animated.View 
        style={[
          styles.statusContainer, 
          { 
            opacity: textAnim,
            transform: [{ translateY: textTranslateY }] 
          }
        ]}
      >
        <View style={styles.badgeContainer}>
          <Ionicons name="flash" size={16} color="#FF6B58" />
          <Text style={styles.badgeText}>AI Processing</Text>
        </View>

        <Text style={styles.titleText}>
          Analyzing your photo{'.'.repeat(dots)}
        </Text>
        <Text style={styles.subtitleText}>
          Detecting objects and translating
        </Text>
      </Animated.View>

      {/* Modern Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4C5C', // Fallback color
    overflow: 'hidden',
  },
  gradientBackground: {
      // Approximate the gradient: from-[#0F4C5C] via-[#1a6b7f] to-[#0F4C5C]
      // React Native style approximation
      backgroundColor: '#0F4C5C', 
      // In a real app, use LinearGradient
  },
  scannerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 300,
  },
  absoluteCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 25, // approximate 50px blur
  },
  circleLarge: {
    width: 256, // w-64
    height: 256, // h-64
  },
  circleMedium: {
    width: 192, // w-48
    height: 192, // h-48
    borderColor: 'rgba(255,255,255,0.4)',
  },
  circleSmall: {
    width: 128, // w-32
    height: 128, // h-32
    borderColor: 'rgba(255,255,255,0.5)',
  },
  centerIconWrapper: {
      width: 160, // w-40
      height: 160, // h-40
      alignItems: 'center',
      justifyContent: 'center',
  },
  glowRing: {
      width: 140, 
      height: 140, 
      borderRadius: 9999,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.1)',
      // Approximate gradient border effect
  },
  glassIconContainer: {
    width: 96, // w-24
    height: 96, // h-24
    borderRadius: 24, // rounded-3xl
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  sparkleIcon: {
      shadowColor: 'white',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
  },
  statusContainer: {
      marginTop: 64, // mt-16
      alignItems: 'center',
  },
  badgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: 9999,
      paddingHorizontal: 24,
      paddingVertical: 8,
  },
  badgeText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      marginLeft: 6,
  },
  titleText: {
      color: 'white',
      fontSize: 30, // text-3xl
      marginBottom: 12,
      fontWeight: '600',
  },
  subtitleText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 16,
  },
  progressContainer: {
      position: 'absolute',
      bottom: 160, // bottom-40
      left: 32, // left-8
      right: 32, // right-8
      width: width - 64,
  },
  progressBarBackground: {
      height: 8, // h-2
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 9999,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: 'white', // gradient fallback
      borderRadius: 9999,
      shadowColor: 'white',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
  },
});



