import React from "react";
import { View, Text } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "full" | "icon";
  colorScheme?: "brand" | "white";
}

export function Logo({
  size = 40,
  className = "",
  variant = "full",
  colorScheme = "brand",
}: LogoProps) {
  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      {/* Icon - Camera Aperture/Shutter Geometric Design */}
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        className="flex-shrink-0"
      >
        {/* Outer Ring */}
        <Circle
          cx="50"
          cy="50"
          r="45"
          stroke={colorScheme === "white" ? "white" : "url(#gradient1)"}
          strokeWidth="3"
          fill="none"
          opacity={colorScheme === "white" ? "0.9" : "1"}
        />

        {/* Aperture Blades - Creating a lens/shutter effect */}
        <G rotation="0" origin="50, 50">
          <Path
            d="M 50 15 L 65 35 L 50 40 Z"
            fill={colorScheme === "white" ? "white" : "url(#gradient2)"}
            opacity={colorScheme === "white" ? "0.85" : "0.9"}
          />
        </G>
        <G rotation="60" origin="50, 50">
          <Path
            d="M 50 15 L 65 35 L 50 40 Z"
            fill={colorScheme === "white" ? "white" : "url(#gradient2)"}
            opacity={colorScheme === "white" ? "0.8" : "0.85"}
          />
        </G>
        <G rotation="120" origin="50, 50">
          <Path
            d="M 50 15 L 65 35 L 50 40 Z"
            fill={colorScheme === "white" ? "white" : "url(#gradient2)"}
            opacity={colorScheme === "white" ? "0.75" : "0.8"}
          />
        </G>
        <G rotation="180" origin="50, 50">
          <Path
            d="M 50 15 L 65 35 L 50 40 Z"
            fill={colorScheme === "white" ? "white" : "url(#gradient3)"}
            opacity={colorScheme === "white" ? "0.85" : "0.9"}
          />
        </G>
        <G rotation="240" origin="50, 50">
          <Path
            d="M 50 15 L 65 35 L 50 40 Z"
            fill={colorScheme === "white" ? "white" : "url(#gradient3)"}
            opacity={colorScheme === "white" ? "0.8" : "0.85"}
          />
        </G>
        <G rotation="300" origin="50, 50">
          <Path
            d="M 50 15 L 65 35 L 50 40 Z"
            fill={colorScheme === "white" ? "white" : "url(#gradient3)"}
            opacity={colorScheme === "white" ? "0.75" : "0.8"}
          />
        </G>

        {/* Center Circle - representing the lens center */}
        <Circle
          cx="50"
          cy="50"
          r="12"
          fill={colorScheme === "white" ? "white" : "url(#gradient4)"}
          opacity={colorScheme === "white" ? "0.9" : "1"}
        />

        {/* Inner highlight circle */}
        <Circle cx="50" cy="50" r="6" fill="white" opacity="0.3" />

        {/* Gradients - only used for brand color scheme */}
        {colorScheme === "brand" && (
          <Defs>
            {/* Outer ring gradient */}
            <LinearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0F4C5C" />
              <Stop offset="50%" stopColor="#1a6b7f" />
              <Stop offset="100%" stopColor="#FF6B58" />
            </LinearGradient>

            {/* Teal blades */}
            <LinearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0F4C5C" />
              <Stop offset="100%" stopColor="#1a6b7f" />
            </LinearGradient>

            {/* Coral blades */}
            <LinearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF6B58" />
              <Stop offset="100%" stopColor="#ff8577" />
            </LinearGradient>

            {/* Center gradient */}
            <LinearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0F4C5C" />
              <Stop offset="100%" stopColor="#FF6B58" />
            </LinearGradient>
          </Defs>
        )}
      </Svg>

      {/* Wordmark */}
      {variant === "full" && (
        <View className="flex-col justify-center">
          {colorScheme === "white" ? (
            <Text className="text-2xl tracking-tight font-bold text-white">
              Lingoscope
            </Text>
          ) : (
            // React Native doesn't support bg-clip-text directly.
            // We'll use a simple colored text for now or MaskedView if we want gradients.
            // Given the "Keep it simple" constraint if possible, I'll use the primary brand color
            // or we can simulate the gradient look with just a solid deep teal for now to ensure stability.
            <Text className="text-2xl tracking-tight font-bold text-deepTeal">
              Lingoscope
            </Text>
          )}
        </View>
      )}
    </View>
  );
}



