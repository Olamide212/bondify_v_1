import {
  Bookmark,
  Flag,
  Share2,
  Trash2,
  UserMinus,
  UserPlus,
  VolumeX,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BaseModal from "../modals/BaseModal";

const OPTIONS = [
  { key: "share",  label: "Share",     icon: Share2,    color: '#D1D5DB' },
  { key: "save",   label: "Save",      icon: Bookmark,  color: '#D1D5DB' },
  { key: "follow", label: "Follow",    icon: UserPlus,  color: '#D1D5DB' },
  { key: "mute",   label: "Mute post", icon: VolumeX,   color: '#D1D5DB' },
  { key: "report", label: "Report",    icon: Flag,      color: "#E53935" },
  { key: "block",  label: "Block",     icon: UserMinus, color: "#E53935" },
];

const OWN_POST_OPTIONS = [
  { key: "share",  label: "Share",     icon: Share2,    color: '#D1D5DB' },
  { key: "delete", label: "Delete",    icon: Trash2,    color: "#E53935" },
];

const PostOptionsModal = ({ visible, onClose, onSelect, isFollowing, isSaved, isOwnPost }) => {
  const baseOptions = isOwnPost ? OWN_POST_OPTIONS : OPTIONS;
  const options = baseOptions.map((opt) => {
    if (opt.key === "follow" && isFollowing) {
      return { ...opt, label: "Unfollow", icon: UserMinus };
    }
    if (opt.key === "save" && isSaved) {
      return { ...opt, label: "Unsave" };
    }
    return opt;
  });

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <TouchableOpacity
              key={opt.key}
              style={styles.option}
              onPress={() => {
                onSelect(opt.key);
                onClose();
              }}
            >
              <Icon size={20} color={opt.color} />
              <Text style={[styles.label, { color: opt.color }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BaseModal>
  );
};

export default PostOptionsModal;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: {
    fontSize: 16,
    fontFamily: "PlusJakartaSansMedium",
  },
});
