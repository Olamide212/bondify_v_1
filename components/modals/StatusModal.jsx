import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ImageIcon, Type } from "lucide-react-native";
import BaseModal from "./BaseModal"; 
import { colors } from "../../constant/colors";

const StatusModal = ({
  visible,
  onClose,
  onUploadPhoto,
  onCreateText,
}) => {
  return (
    <BaseModal visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Status</Text>

        <Pressable style={styles.button} onPress={onUploadPhoto}>
          <ImageIcon size={20} color="#fff" />
          <Text style={styles.buttonText}>Photo / Video Status</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={onCreateText}>
          <Type size={20} color="#fff" />
          <Text style={styles.buttonText}>Text Status</Text>
        </Pressable>

        <Pressable onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </BaseModal>
  );
};

export default StatusModal;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E1E1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    width: "90%",
    marginBottom: 12,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
  },
  cancelText: {
    color: "#aaa",
    fontSize: 14,
  },
});
