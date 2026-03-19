import { Platform } from "react-native";

export const theme = {
  colors: {
    background: "#F8F4EC",
    backgroundMuted: "#E7DED0",
    text: "#223127",
    subtleText: "#4D5D53",
    mutedText: "#7A847D",
    accent: "#506B57",
    surface: "#FFFDF8",
    surfaceMuted: "#ECE6DA",
    border: "#DED6C8",
    cardAccent: "#506B57",
    mapSurface: "#D7E2DA"
  },
  fonts: {
    serif: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "Georgia"
    }),
    sans: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: "system-ui"
    })
  }
} as const;
