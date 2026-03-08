import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import BaseModal from "../modals/BaseModal";
import { colors } from '../../constant/colors';
import { Icons } from '../../constant/icons';

const RIZZ_WORDS = [
  "Hey there! 😊",
  "What's up?",
  "You have a great smile!",
  "Can I get to know you better?",
  "You seem interesting!",
  "Let's chat!",
  "How's your day going?",
  "If you were a fruit, you'd be a fine-apple! 🍍",
  "Are you a magician? Because whenever I look at you, everyone else disappears!",
  "Do you believe in love at first swipe?"
];

const getRandomIndex = (excludeIdx, arrLength) => {
  let idx;
  do {
    idx = Math.floor(Math.random() * arrLength);
  } while (arrLength > 1 && idx === excludeIdx);
  return idx;
};

const RizzModal = ({ visible, onClose, onSend }) => {
  const [currentIdx, setCurrentIdx] = useState(() => getRandomIndex(-1, RIZZ_WORDS.length));

  useEffect(() => {
    if (visible) setCurrentIdx(getRandomIndex(-1, RIZZ_WORDS.length));
  }, [visible]);

  const handleShowAnother = () => {
    setCurrentIdx((prev) => getRandomIndex(prev, RIZZ_WORDS.length));
  };

  return (
    <BaseModal visible={visible} onClose={onClose} fullScreen={false}>
      <View style={styles.container}>
        <View style={styles.header}>
            <Image source={Icons.BotIcon} style={{ width: 70, height: 70 }} />
        </View>
       
        <View style={styles.rizzItem}>
          <Text style={styles.rizzText} className='font-PlusJakartaSansSemiBold'>{RIZZ_WORDS[currentIdx]}</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShowAnother}>
            <MaterialIcons name="autorenew" size={26} color={colors.activePrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => onSend(RIZZ_WORDS[currentIdx])}>
            <Text style={styles.primaryBtnText} className='font-PlusJakartaSansBold'>Use This</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    marginLeft: 8,
  },
  subtitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  rizzItem: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 18,
    alignSelf: 'stretch',
    minWidth: 220,
  },
  rizzText: {
    color: '#1F2937',
    fontSize: 18,
    textAlign: 'center',

  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    gap: 12,
  },
  iconBtn: {
    backgroundColor: '#FFF8F5',
    borderRadius: 50,
    padding: 15,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.activePrimary,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flex: 1,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: '#FFF8F5',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    flex: 1,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.activePrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RizzModal;
