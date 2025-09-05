import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/snackbar/Toast";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    duration: 3000,
    variant: "info",
  });

const showToast = useCallback(
  ({ message, variant = "info", duration = 3000 }) => {
    setToast({ visible: true, message, duration, variant });
  },
  []
);


  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        duration={toast.duration}
        variant={toast.variant}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
