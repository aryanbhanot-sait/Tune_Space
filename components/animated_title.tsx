import React, { useEffect, useRef } from "react";
import { Animated, Text, TextProps } from "react-native";

const COLOR_LIST = [
  "#FF5F6D", // Vivid Hot Pink
  "#FFC371", // Sunny Orange/Yellow
  "#47E2EC", // Aqua Blue
  "#4E54C8", // Deep Indigo
  "#24FF6D", // Neon Green
  "#FF55A8", // Electric Pink
  "#FFD700", // Gold
  "#7B2FF2", // Vivid Violet
  "#5E57FF", // Blue Lotus
  "#F23CA6", // Persian Rose
  "#FF9535", // Dark Orange (neon)
  "#4BFF36", // Neon Grass Green
  "#02FEE4", // Fluorescent Cyan
  "#F500EB", // Fuchsia
  "#0CD4FF", // Vivid Sky Blue
  "#8DFF0A", // Chartreuse
  "#FFEF06", // Canary
  "#FC1FF9", // Fuchsia (different)
  "#BC0EEF", // Electric Purple
  "#E42536", // Poppy Red
  "#FC5E31", // Giant's Orange
  "#8921C2", // French Violet
  "#FE39A4", // Rose Bonbon
  "#FFFDBB", // Light Lemon
  "#53E8D4", // Turquoise
  "#25C4F8", // Sky (blue)
  "#F354A9", // Brilliant Rose
  "#84F5D5", // Aquamarine
  "#9D2EB0", // Purpureus
  "#FF5F6D", // Loop back to first color for seamless animation
];


// 7 colors, so 6 intervals, 1 sec for each, 6 sec per loop

type AnimatedTitleProps = TextProps & {
  children: string;
};

const INTERVAL = 1 / (COLOR_LIST.length - 1);

export default function AnimatedTitle({ children, ...props }: AnimatedTitleProps) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: (COLOR_LIST.length - 1) * 1300, // 1 sec per color step
        useNativeDriver: false,
      })
    ).start();
  }, [animation]);

  const inputRange = COLOR_LIST.map((_, idx) => idx * INTERVAL);

  const color = animation.interpolate({
    inputRange,
    outputRange: COLOR_LIST,
  });

  return (
    <Animated.Text
      style={{
        fontSize: 48,
        fontWeight: "bold",
        color,
        marginBottom: 48,
        textAlign: "center",
        letterSpacing: 1,
      }}
      {...props}
    >
      
      {children}
    </Animated.Text>
  );
}