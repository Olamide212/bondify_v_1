// import { configureStore } from "@reduxjs/toolkit";
// import {
//   persistStore,
//   persistReducer,
//   FLUSH,
//   REHYDRATE,
//   PAUSE,
//   PERSIST,
//   PURGE,
//   REGISTER,
// } from "redux-persist";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// import authReducer from "../slices/authSlice";
// // import profileReducer from "./slices/profileSlice";
// // import onboardingReducer from "./slices/onboardingSlice";

// // Persist configuration
// const persistConfig = {
//   key: "root",
//   version: 1,
//   storage: AsyncStorage,
//   whitelist: ["auth", "profile"], // Only persist these slices
// };

// // Create persisted reducers
// const persistedAuthReducer = persistReducer(persistConfig, authReducer);
// // const persistedProfileReducer = persistReducer(persistConfig, profileReducer);

// // Configure store
// export const store = configureStore({
//   reducer: {
//     auth: persistedAuthReducer,
//     // profile: persistedProfileReducer,
//     // onboarding: onboardingReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
//       },
//     }),
// });

// export const persistor = persistStore(store);

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth"], // 👈 persist auth slice only
};

const persistedReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

