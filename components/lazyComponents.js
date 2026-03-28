import { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Lazy loading wrapper for React Native components
function LazyWrapper({ importFunc, fallback = null, ...props }) {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    importFunc()
      .then(module => {
        setComponent(() => module.default || module);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading component:', error);
        setLoading(false);
      });
  }, [importFunc]);

  if (loading) {
    return fallback || (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return Component ? <Component {...props} /> : null;
}

// Lazy load heavy components to improve initial bundle size
export const LazyBondupDetailModal = (props) => (
  <LazyWrapper
    importFunc={() => import('../components/bondup/BondupDetailModal')}
    {...props}
  />
);

export const LazyCreateBondupModal = (props) => (
  <LazyWrapper
    importFunc={() => import('../components/bondup/CreateBondupModal')}
    {...props}
  />
);

export const LazyBondupChatScreen = (props) => (
  <LazyWrapper
    importFunc={() => import('../components/bondup/BondupChatScreen')}
    {...props}
  />
);

export const LazyChatScreen = (props) => (
  <LazyWrapper
    importFunc={() => import('../components/chatScreen/ChatScreen')}
    {...props}
  />
);

export const LazyProfileCard = (props) => (
  <LazyWrapper
    importFunc={() => import('../components/homeScreen/ProfileCard')}
    {...props}
  />
);

export const LazyFeedScreen = (props) => (
  <LazyWrapper
    importFunc={() => import('../app/(root)/(tab)/feed')}
    {...props}
  />
);

export const LazyCommunityScreen = (props) => (
  <LazyWrapper
    importFunc={() => import('../app/(root)/(tab)/community')}
    {...props}
  />
);