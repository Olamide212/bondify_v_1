// components/modals/BaseModal.js
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

const BaseModal = ({ visible, onClose, children, fullScreen = false }) => {
  const [showModal, setShowModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);

      if (!fullScreen) {
        // Animate only for bottom-sheet
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      if (!fullScreen) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowModal(false);
        });
      } else {
        setShowModal(false);
      }
    }
  }, [visible, fullScreen]);

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent={!fullScreen}
      animationType={fullScreen ? "slide" : "none"}
      presentationStyle={fullScreen ? "fullScreen" : "overFullScreen"}
      onRequestClose={onClose}
    >
      {!fullScreen && (
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
      )}

      {fullScreen ? (
        // Full screen content
        <View style={styles.fullScreenContent}>{children}</View>
      ) : (
        // Bottom sheet content
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      )}
    </Modal>
  );
};

export default BaseModal;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    maxHeight: "100%",
    width: "100%",
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  fullScreenContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
