import { useRouter } from "expo-router";
import {
    Baby, BookOpen, ChevronRight, Cigarette, Dumbbell,
    Flag,
    Globe, Heart, HeartHandshake, MessageCircleHeart,
    PawPrint,
    Ruler, Sparkles, Users, Wallet, Wine, X
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import NationalityModal from "../../components/modals/NationalityModal";
import { colors } from "../../constant/colors";
import { useLookupOptions } from "../../hooks/useLookupOptions";
import BaseModal from "../modals/BaseModal";
import ProfileEthnicityModal from "../modals/ProfileEthnicityModal";
import ProfileHeightModal from "../modals/ProfileHeightModal";
import ProfileReligionModal from "../modals/ProfileReligionModal";
import ProfileDisplayZodiacModal from "../modals/ProfileZodiacDisplayModal";

// ─────────────────────────────────────────────────────────────────────────────
const vals = (opts) => opts.map((o) => o.value);

const MAX_INTERESTS = 5;
const PLACEHOLDER_INTERESTS = ['Art', 'Gaming', 'Cooking', 'Travel', 'Music'];

// Short human-friendly labels for lifestyle fields
const SHORT_LABEL = {
  Never: 'Rarely active', Rarely: 'Rarely active',
  Sometimes: 'Active sometimes', Often: 'Gym goer', Daily: 'Daily trainer',
  "No, I don't drink": 'Non-drinker', Socially: 'Social drinker',
  Regularly: 'Regular drinker',
  "No, I don't smoke": 'Non-smoker', Occasionally: 'Occasional smoker',
  'I have pets': 'Pet owner', 'I want pets': 'Wants pets',
  "I don't want pets": 'No pets', 'Allergic to pets': 'Pet allergy',
  'Prefer not to say': null,
};
const shorten = (val) => (val ? (SHORT_LABEL[val] ?? val) : null);

// ─── Reusable section title ───────────────────────────────────────────────────
const SectionTitle = ({ label }) => (
  <Text style={s.sectionTitle}>{label}</Text>
);

// ─── Single row inside a card ─────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, title, displayValue, isLast, onPress }) => (
  <TouchableOpacity
    style={[s.row, !isLast && s.rowBorder]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={s.rowLeft}>
      <Icon size={18} color="#fff" />
      <Text style={s.rowTitle}>{title}</Text>
    </View>
    <View style={s.rowRight}>
      {displayValue ? (
        <Text style={s.rowValue} numberOfLines={1}>{displayValue}</Text>
      ) : (
        <Text style={s.rowAdd}>Add</Text>
      )}
      <ChevronRight size={15} color="#fff" />
    </View>
  </TouchableOpacity>
);

// ─── White rounded card wrapper ───────────────────────────────────────────────
const Card = ({ children }) => <View style={s.card}>{children}</View>;

// ─────────────────────────────────────────────────────────────────────────────
const MyInfo = ({ profile, onUpdateField }) => {
  const router = useRouter();
  const [profileData, setProfileData]           = useState(profile || {});
  const [activeModal, setActiveModal]           = useState(null);
  const [nationalityVisible, setNationalityVisible] = useState(false);
  const [zodiacVisible, setZodiacVisible]       = useState(false);
  const [ethnicityVisible, setEthnicityVisible] = useState(false);
  const [religionVisible, setReligionVisible]   = useState(false);
  const [heightVisible, setHeightVisible]       = useState(false);

  // ── Lookups ──────────────────────────────────────────────────────────────
  const { options: familyPlansOpts,        loading: l1 } = useLookupOptions('family-plans');
  const { options: drinkingOpts,           loading: l2 } = useLookupOptions('drinking-habits');
  const { options: smokingOpts,            loading: l3 } = useLookupOptions('smoking-habits');
  const { options: exerciseOpts,           loading: l4 } = useLookupOptions('exercise-habits');
  const { options: petsOpts,               loading: l5 } = useLookupOptions('pets');
  const { options: communicationOpts,      loading: l6 } = useLookupOptions('communication-style');
  const { options: loveLanguageOpts,       loading: l7 } = useLookupOptions('love-language');
  const { options: financialStyleOpts,     loading: l8 } = useLookupOptions('financial-style');
  const { options: relationshipStatusOpts, loading: l9 } = useLookupOptions('relationship-status');
  const { options: lookingForOpts,         loading: l10} = useLookupOptions('looking-for');
  const { options: sameBeliefsOpts,        loading: l11} = useLookupOptions('same-beliefs');
  const anyLoading = l1||l2||l3||l4||l5||l6||l7||l8||l9||l10||l11;

  useEffect(() => { setProfileData(profile || {}); }, [profile]);

  const fieldMap = {
    zodiac:             'zodiacSign',
    kids:               'children',
    drink:              'drinking',
    smoke:              'smoking',
    workout:            'exercise',
    relationshipStatus: 'relationshipType',
    interestedIn:       'lookingFor',
    loveStyle:          'loveLanguage',
    communicationStyle: 'communicationStyle',
    financialStyle:     'financialStyle',
    sameBeliefs:        'religionImportance',
  };

  const openModal = (key, title, options) => setActiveModal({ key, title, options });

  const handleSaveModal = (key, value) => {
    const targetField = fieldMap[key] || key;
    const finalValue  = key === 'height' ? parseInt(value, 10) : value;
    setProfileData((prev) => ({ ...prev, [targetField]: finalValue }));
    onUpdateField?.(targetField, finalValue);
    setActiveModal(null);
  };

  const getVal = (key) => {
    const field = fieldMap[key] || key;
    const raw   = profileData?.[field];
    if (key === 'height' && typeof raw === 'number') return `${raw} cm`;
    if (Array.isArray(raw)) return raw.join(', ');
    return raw || null;
  };

  // ── Interests helpers ────────────────────────────────────────────────────
  const interests   = Array.isArray(profileData?.interests) ? profileData.interests : [];
  const preview     = interests.slice(0, MAX_INTERESTS);
  const emptyCount  = Math.max(0, MAX_INTERESTS - preview.length);
  const placeholders = PLACEHOLDER_INTERESTS
    .filter((p) => !interests.includes(p))
    .slice(0, emptyCount);

  const handleRemoveInterest = (interest) => {
    const updated = interests.filter((i) => i !== interest);
    setProfileData((prev) => ({ ...prev, interests: updated }));
    onUpdateField?.('interests', updated);
  };

  // ── Lifestyle chips ──────────────────────────────────────────────────────
  const lifestyleItems = [
    { field: 'exercise', icon: Dumbbell  },
    { field: 'drinking', icon: Wine      },
    { field: 'smoking',  icon: Cigarette },
    { field: 'pets',     icon: PawPrint  },
  ].map(({ field, icon }) => ({ label: shorten(profileData?.[field]), icon }))
   .filter(({ label }) => label && label !== 'Prefer not to say');

  return (
    <View style={s.container}>
      {/* {anyLoading && (
        <View style={s.loadingRow}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )} */}

      {/* ── INTERESTS ───────────────────────────────────────────────────── */}
     

      {/* ── LIFESTYLE ───────────────────────────────────────────────────── */}
      <SectionTitle label="Lifestyle" />
      <Card>
        {lifestyleItems.length === 0 ? (
          <TouchableOpacity
            style={s.emptyState}
            onPress={() => openModal('drink', 'Do you drink?', vals(drinkingOpts))}
          >
            <Text style={s.emptyText}>Add your lifestyle details below ↓</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.lifestyleGrid}>
            {lifestyleItems.map(({ label, icon: Icon }, i) => (
              <View key={i} style={s.lifestyleChip}>
                <Icon size={15} color="#fff" strokeWidth={1.8} />
                <Text style={s.lifestyleChipText}>{label}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* ── BASICS ──────────────────────────────────────────────────────── */}
      <SectionTitle label="Basics" />
      <Card>
        {[
          { key: 'nationality', title: 'Nationality',  icon: Flag     },
          { key: 'zodiac',      title: 'Zodiac Sign',  icon: Sparkles },
          { key: 'ethnicity',   title: 'Ethnicity',    icon: Globe    },
          { key: 'height',      title: 'Height',       icon: Ruler    },
          { key: 'religion',    title: 'Religion',     icon: BookOpen },
        ].map(({ key, title, icon }, i, arr) => (
          <InfoRow
            key={key}
            icon={icon}
            title={title}
            displayValue={getVal(key)}
            isLast={i === arr.length - 1}
            onPress={() => {
              if (key === 'nationality') { setNationalityVisible(true); return; }
              if (key === 'zodiac')      { setZodiacVisible(true);      return; }
              if (key === 'ethnicity')   { setEthnicityVisible(true);   return; }
              if (key === 'height')      { setHeightVisible(true);      return; }
              if (key === 'religion')    { setReligionVisible(true);    return; }
            }}
          />
        ))}
      </Card>

      {/* ── LIFESTYLE FIELDS ────────────────────────────────────────────── */}
      <SectionTitle label="Habits" />
      <Card>
        {[
          { key: 'kids',    title: 'Kids',           icon: Baby,     options: vals(familyPlansOpts) },
          { key: 'drink',   title: 'Do you drink?',  icon: Wine,     options: vals(drinkingOpts) },
          { key: 'smoke',   title: 'Do you smoke?',  icon: Cigarette,options: vals(smokingOpts) },
          { key: 'pets',    title: 'Pets',            icon: PawPrint, options: vals(petsOpts) },
          { key: 'workout', title: 'Exercise',        icon: Dumbbell, options: vals(exerciseOpts) },
        ].map(({ key, title, icon, options }, i, arr) => (
          <InfoRow
            key={key}
            icon={icon}
            title={title}
            displayValue={getVal(key)}
            isLast={i === arr.length - 1}
            onPress={() => openModal(key, title, options)}
          />
        ))}
      </Card>

      {/* ── RELATIONSHIP ─────────────────────────────────────────────────── */}
      <SectionTitle label="Relationship" />
      <Card>
        {[
          { key: 'relationshipStatus', title: 'Relationship Status',               icon: Heart,             options: vals(relationshipStatusOpts) },
          { key: 'interestedIn',       title: "I'm interested in...",              icon: Users,             options: vals(lookingForOpts) },
          { key: 'sameBeliefs',        title: 'Same beliefs matter to me...',      icon: HeartHandshake,    options: vals(sameBeliefsOpts) },
        ].map(({ key, title, icon, options }, i, arr) => (
          <InfoRow
            key={key}
            icon={icon}
            title={title}
            displayValue={getVal(key)}
            isLast={i === arr.length - 1}
            onPress={() => openModal(key, title, options)}
          />
        ))}
      </Card>

      {/* ── PERSONALITY ──────────────────────────────────────────────────── */}
      <SectionTitle label="Personality" />
      <Card>
        {[
          { key: 'loveStyle',          title: 'Love Language',       icon: Heart,             options: vals(loveLanguageOpts) },
          { key: 'communicationStyle', title: 'Communication Style', icon: MessageCircleHeart,options: vals(communicationOpts) },
          { key: 'financialStyle',     title: 'Financial Style',     icon: Wallet,            options: vals(financialStyleOpts) },
        ].map(({ key, title, icon, options }, i, arr) => (
          <InfoRow
            key={key}
            icon={icon}
            title={title}
            displayValue={getVal(key)}
            isLast={i === arr.length - 1}
            onPress={() => openModal(key, title, options)}
          />
        ))}
      </Card>

      {/* ── INTERESTS & HOBBIES ──────────────────────────────────────────── */}
      {/* <SectionTitle label="Interests & Hobbies" /> */}
      {/* <Card>
        <View style={s.interestsGrid}>

          {Array.isArray(profileData?.favoriteMusic) && profileData.favoriteMusic.length > 0 && (
            <View style={s.interestCategory}>
              <View style={s.categoryHeader}>
                <Music size={16} color={colors.primary} />
                <Text style={s.categoryTitle}>Music</Text>
              </View>
              <View style={s.chipsRow}>
                {profileData.favoriteMusic.slice(0, 3).map((item, idx) => (
                  <View key={idx} style={s.interestChip}>
                    <Text style={s.interestChipText}>{item}</Text>
                  </View>
                ))}
                {profileData.favoriteMusic.length > 3 && (
                  <View style={s.moreChip}>
                    <Text style={s.moreChipText}>+{profileData.favoriteMusic.length - 3}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

 
          {Array.isArray(profileData?.favoriteVideos) && profileData.favoriteVideos.length > 0 && (
            <View style={s.interestCategory}>
              <View style={s.categoryHeader}>
                <Play size={16} color={colors.primary} />
                <Text style={s.categoryTitle}>Videos</Text>
              </View>
              <View style={s.chipsRow}>
                {profileData.favoriteVideos.slice(0, 3).map((item, idx) => (
                  <View key={idx} style={s.interestChip}>
                    <Text style={s.interestChipText}>{item}</Text>
                  </View>
                ))}
                {profileData.favoriteVideos.length > 3 && (
                  <View style={s.moreChip}>
                    <Text style={s.moreChipText}>+{profileData.favoriteVideos.length - 3}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          
          {Array.isArray(profileData?.funActivities) && profileData.funActivities.length > 0 && (
            <View style={s.interestCategory}>
              <View style={s.categoryHeader}>
                <Gamepad2 size={16} color={colors.primary} />
                <Text style={s.categoryTitle}>Activities</Text>
              </View>
              <View style={s.chipsRow}>
                {profileData.funActivities.slice(0, 3).map((item, idx) => (
                  <View key={idx} style={s.interestChip}>
                    <Text style={s.interestChipText}>{item}</Text>
                  </View>
                ))}
                {profileData.funActivities.length > 3 && (
                  <View style={s.moreChip}>
                    <Text style={s.moreChipText}>+{profileData.funActivities.length - 3}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

     
          {(!Array.isArray(profileData?.favoriteMusic) || profileData.favoriteMusic.length === 0) &&
           (!Array.isArray(profileData?.favoriteVideos) || profileData.favoriteVideos.length === 0) &&
           (!Array.isArray(profileData?.funActivities) || profileData.funActivities.length === 0) && (
            <TouchableOpacity
              style={s.emptyState}
              onPress={() => router.push('/profile-edit')}
            >
              <Text style={s.emptyText}>Add your interests and hobbies</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card> */}

      {/* ── OPTION PICKER MODAL ──────────────────────────────────────────── */}
      <BaseModal visible={!!activeModal} onClose={() => setActiveModal(null)} fullScreen>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#121212', padding: 24 }}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <X color="#fff" />
              </TouchableOpacity>
              <Text style={s.modalTitle}>{activeModal?.title}</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              {activeModal?.options?.map((option, idx) => {
                const modalField  = fieldMap[activeModal?.key] || activeModal?.key;
                const storedValue = profileData?.[modalField];
                const selected    = activeModal?.key === 'height'
                  ? storedValue === parseInt(option, 10)
                  : storedValue === option;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[s.optionBtn, selected && s.optionBtnSelected]}
                    onPress={() => handleSaveModal(activeModal.key, option)}
                  >
                    <Text style={[s.optionText, selected && s.optionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </BaseModal>

      {/* ── SPECIALTY MODALS ─────────────────────────────────────────────── */}
      <NationalityModal
        visible={nationalityVisible}
        onClose={() => setNationalityVisible(false)}
        onSelect={(item) => {
          setProfileData((prev) => ({ ...prev, nationality: item.key }));
          onUpdateField?.('nationality', item.key);
          setNationalityVisible(false);
        }}
      />
      <ProfileDisplayZodiacModal
        visible={zodiacVisible}
        onClose={() => setZodiacVisible(false)}
        initialSelected={profileData.zodiacSign}
        onSelect={(value) => {
          setProfileData((prev) => ({ ...prev, zodiacSign: value }));
          onUpdateField?.('zodiacSign', value);
          setZodiacVisible(false);
        }}
      />
      <ProfileEthnicityModal
        visible={ethnicityVisible}
        onClose={() => setEthnicityVisible(false)}
        initialSelected={profileData.ethnicity}
        onSelect={(value) => {
          setProfileData((prev) => ({ ...prev, ethnicity: value }));
          onUpdateField?.('ethnicity', value);
          setEthnicityVisible(false);
        }}
      />
      <ProfileHeightModal
        visible={heightVisible}
        onClose={() => setHeightVisible(false)}
        initialSelected={profileData.height}
        onSelect={(value) => {
          setProfileData((prev) => ({ ...prev, height: value }));
          onUpdateField?.('height', value);
          setHeightVisible(false);
        }}
      />
      <ProfileReligionModal
        visible={religionVisible}
        onClose={() => setReligionVisible(false)}
        initialSelected={profileData.religion}
        onSelect={(value) => {
          setProfileData((prev) => ({ ...prev, religion: value }));
          onUpdateField?.('religion', value);
          setReligionVisible(false);
        }}
      />
    </View>
  );
};

export default MyInfo;

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    gap: 0,
    paddingHorizontal: 16,
  },

  loadingRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  // Section title above each card
  sectionTitle: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSansBold',
    color:      '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop:  20,
    marginBottom: 8,
    marginLeft: 4,
  },

  // White card
  card: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
    overflow:        'hidden',
    paddingHorizontal: 16,
  },

  // Row inside card
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.whiteLight,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    flex:          1,
  },
  rowTitle: {
    fontSize:   16,
    fontFamily: 'PlusJakartaSansSemiBold',
    color: '#E5E5E5',
    flexShrink: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    maxWidth:      '45%',
  },
  rowValue: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSansMedium',
    color:      '#9CA3AF',
    flexShrink: 1,
    textTransform: 'capitalize'
  },
  rowAdd: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSansMedium',
    color:      colors.primary,
  },

  // ── Interests ──
  interestsHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: 14,
  },
  interestsSub: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSans',
    color:      '#9CA3AF',
  },
  viewAll: {
    fontSize:   14,
    fontFamily: 'PlusJakartaSansBold',
    color:      '#E8651A',
  },
  chipsRow: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            8,
    paddingBottom:  16,
  },
  chipSelected: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    backgroundColor:   '#E8651A',
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:      99,
  },
  chipSelectedText: {
    fontSize:   14,
    fontFamily: 'PlusJakartaSansSemiBold',
    color:      '#fff',
  },
  chipEmpty: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical:   10,
    borderRadius:      99,
    borderWidth:       1,
    borderColor: '#374151',
  },
  chipEmptyText: {
    fontSize:   14,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#D1D5DB',
  },

  // ── Lifestyle preview grid ──
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
    paddingVertical: 14,
  },
  lifestyleChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical:   9,
    borderRadius:      99,
    minWidth:          '46%',
    flexShrink:        1,
  },
  lifestyleChipText: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#D1D5DB',
    flexShrink: 1,
  },

  emptyState: {
    paddingVertical: 18,
    alignItems:      'center',
  },
  emptyText: {
    fontSize:   13,
    fontFamily: 'PlusJakartaSans',
    color:      '#9CA3AF',
  },

  // ── Modal ──
  modalHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   24,
  },
  modalTitle: {
    fontSize:   17,
    fontFamily: 'PlusJakartaSansBold',
    color: '#E5E5E5',
  },
  optionBtn: {
    paddingVertical:   14,
    paddingHorizontal: 24,
    borderRadius:      99,
    marginBottom:      10,
    backgroundColor: colors.whiteLight,
    borderWidth:       1,
    borderColor: colors.whiteLight,
  },
  optionBtnSelected: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  optionText: {
    fontSize:   16,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#E5E5E5',
    textAlign:  'center',
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: '#fff',
  },
});