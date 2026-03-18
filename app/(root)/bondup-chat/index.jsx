/**
 * app/(root)/bondup-chat/index.jsx
 *
 * Route for the Bondup group chat screen.
 * Params: chatId, bondupId, bondupTitle, participantCount
 */

import { useLocalSearchParams } from 'expo-router';
import BondupChatScreen from '../../../components/bondup/BondupChatScreen';

export default function BondupChatRoute() {
  const { chatId, bondupId, bondupTitle, participantCount } = useLocalSearchParams();
  return (
    <BondupChatScreen
      chatId={chatId}
      bondupId={bondupId}
      bondupTitle={bondupTitle}
      participantCount={Number(participantCount) || 0}
    />
  );
}
