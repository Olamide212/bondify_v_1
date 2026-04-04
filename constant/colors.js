import { StyleSheet } from "react-native";

export const colors = {
    primary: "#FE01AA",
    background: "#121212",
    secondary: "#412599",
    white: "#fff",
    whiteLight: 'rgba(255,255,255,0.1)',
    tertiary: "#BC96FE",
    gray: "#64748B",
    activePrimary: "#371F7D",
    inactiveTab: "#9CA3AF",
    primaryLight: "#1E1A2E",
    primaryBorder: "#4A3D6E",
    pinkColor: "#ff4365",
    surface: "#1E1E1E",
    surfaceLight: "#2A2A2A",
    text: "#FFFFFF",
    textSecondary: "#9CA3AF",
};

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    text: {
        color: colors.white,
        fontFamily: 'Outfit',
    },
    boxContainer: {
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
       
  
    }
    
});