import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAlert } from '../context/AlertContext';
import bondupChatService from '../services/bondupChatService';
import bondupService from '../services/bondupService';

export const useBondupInteractions = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user: currentUser } = useSelector((s) => s.auth);
  const [joinLoading, setJoinLoading] = useState(false);

  const handleJoin = useCallback(async (bondupId, onSuccess) => {
    setJoinLoading(true);
    try {
      const res = await bondupService.joinBondup(bondupId);
      if (res.success) {
        onSuccess?.(res.data);
        showAlert({
          icon: 'success',
          title: 'Joined!',
          message: 'You\'ve successfully joined this Bondup.',
        });
      } else {
        throw new Error(res.message || 'Failed to join');
      }
    } catch (err) {
      const msg = err.message || 'Could not join Bondup. Try again.';
      showAlert({
        icon: 'error',
        title: 'Error',
        message: msg,
      });
    } finally {
      setJoinLoading(false);
    }
  }, [showAlert]);

  const handleLeave = useCallback(async (bondupId, onSuccess) => {
    try {
      const res = await bondupService.leaveBondup(bondupId);
      if (res.success) {
        onSuccess?.(res.data);
      }
    } catch {
      // Reload data on error
      onSuccess?.();
    }
  }, []);

  const handleDelete = useCallback(async (bondupId, onSuccess) => {
    try {
      await bondupService.deleteBondup(bondupId);
      onSuccess?.();
    } catch {
      // Handle error silently
    }
  }, []);

  const handleStartChat = useCallback(async (bondup, onSuccess) => {
    try {
      const res = await bondupChatService.startChat(bondup._id);
      if (res.success && res.data?._id) {
        const chatId = res.data._id;
        onSuccess?.(chatId);
        router.push({
          pathname: '/bondup-chat',
          params: {
            chatId,
            bondupId: bondup._id,
            bondupTitle: bondup.title,
            participantCount: (bondup.participants?.length || 0) + 1,
          },
        });
      }
    } catch {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not start chat. Try again.',
      });
    }
  }, [router, showAlert]);

  const handleStartDirectChat = useCallback(async (userId, onSuccess) => {
    try {
      // This would need to be implemented based on your chat system
      // For now, just call onSuccess
      onSuccess?.();
    } catch {
      showAlert({
        icon: 'error',
        title: 'Error',
        message: 'Could not start chat. Try again.',
      });
    }
  }, [showAlert]);

  return {
    joinLoading,
    handleJoin,
    handleLeave,
    handleDelete,
    handleStartChat,
    handleStartDirectChat,
  };
};