import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { styles as appStyles } from "../../constant/colors";
import { useTheme } from "../../context/ThemeContext";

const SettingsSection = ({ title, items }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        appStyles.boxContainer,
      ]}
    >
      {title && (
        <Text style={[styles.title, { color: '#FFFFFF' }]}>
          {title}
        </Text>
      )}

      {items.map(({ title, subtitle, description, onPress, icon: RightIcon }, index) => {
        const isLast = index === items.length - 1;

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.row,
              !isLast && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: 'rgba(255,255,255,0.1)',
              },
            ]}
            onPress={onPress}
            activeOpacity={0.65}
          >
            <View style={styles.rowInner}>
              {/* Left: title + optional description */}
              <View style={styles.textBlock}>
                <Text style={[styles.rowTitle, { color: '#FFFFFF' }]}>
                  {title}
                </Text>
                {description && (
                  <Text style={[styles.rowDescription, { color: '#9CA3AF' }]}>
                    {description}
                  </Text>
                )}
              </View>

              {/* Right: subtitle hint + icon */}
              <View style={styles.rightBlock}>
                {subtitle && (
                  <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
                    {subtitle}
                  </Text>
                )}
                {RightIcon ? (
                  <RightIcon size={20} color="red" />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color='#fff'
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 16,

    paddingTop: 20,
    paddingBottom: 4,

    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 4,
    // elevation: 2,
  },
  title: {
    fontSize: 24,
    fontFamily: "PlusJakartaSansBold",
    marginBottom: 8,
  },
  row: {
    paddingVertical: 16,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  textBlock: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontFamily: "PlusJakartaSansSemiBold",
  },
  rowDescription: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
    marginTop: 2,
    lineHeight: 19,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
  },
});

export default SettingsSection;