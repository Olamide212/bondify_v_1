/**
 * AlertContext.js
 *
 * Global alert context to replace native Alert.alert() calls with
 * a custom in-app modal that matches the app's design.
 *
 * Usage:
 *   import { useAlert } from '../context/AlertContext';
 *
 *   const { showAlert, hideAlert } = useAlert();
 *
 *   // Simple info alert (single OK button)
 *   showAlert({
 *     title: 'Success',
 *     message: 'Your changes have been saved.',
 *   });
 *
 *   // Alert with icon
 *   showAlert({
 *     icon: 'success', // 'success' | 'error' | 'warning' | 'info' | 'leave' | 'delete' | 'question' | emoji
 *     title: 'Success',
 *     message: 'Your changes have been saved.',
 *   });
 *
 *   // Confirmation alert with actions
 *   showAlert({
 *     icon: 'warning',
 *     title: 'Delete Item?',
 *     message: 'This action cannot be undone.',
 *     actions: [
 *       { label: 'Cancel', style: 'cancel' },
 *       { label: 'Delete', style: 'destructive', onPress: handleDelete },
 *     ],
 *   });
 */

import { createContext, useCallback, useContext, useState } from "react";
import AlertModal from "../components/modals/AlertModal";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    visible: false,
    icon: null,
    title: "",
    message: "",
    actions: [],
  });
  const [loading, setLoading] = useState(false);

  const hideAlert = useCallback(() => {
    setAlert({
      visible: false,
      icon: null,
      title: "",
      message: "",
      actions: [],
    });
    setLoading(false);
  }, []);

  const showAlert = useCallback(
    ({ icon = null, title = "", message = "", actions }) => {
      // If no actions provided, default to a single "OK" button
      const resolvedActions = actions || [
        { label: "OK", style: "primary", onPress: hideAlert },
      ];

      // Wrap each action's onPress to auto-close after execution (unless it returns false)
      const wrappedActions = resolvedActions.map((action) => ({
        ...action,
        onPress: async () => {
          if (action.onPress) {
            const result = await action.onPress();
            // If action returns false, don't auto-close (useful for chained alerts)
            if (result === false) return;
          }
          hideAlert();
        },
      }));

      setAlert({
        visible: true,
        icon,
        title,
        message,
        actions: wrappedActions,
      });
    },
    [hideAlert]
  );

  // Helper for confirmation dialogs (returns a promise)
  const confirm = useCallback(
    ({ icon = "question", title, message, confirmLabel = "OK", cancelLabel = "Cancel", confirmStyle = "primary" }) => {
      return new Promise((resolve) => {
        setAlert({
          visible: true,
          icon,
          title,
          message,
          actions: [
            {
              label: cancelLabel,
              style: "cancel",
              onPress: () => {
                hideAlert();
                resolve(false);
              },
            },
            {
              label: confirmLabel,
              style: confirmStyle,
              onPress: () => {
                hideAlert();
                resolve(true);
              },
            },
          ],
        });
      });
    },
    [hideAlert]
  );

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, confirm, setLoading }}>
      {children}
      <AlertModal
        visible={alert.visible}
        icon={alert.icon}
        title={alert.title}
        message={alert.message}
        actions={alert.actions}
        onClose={hideAlert}
        loading={loading}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
