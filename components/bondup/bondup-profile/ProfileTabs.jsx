import { Calendar, Users } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../constant/colors';

const BRAND = colors.primary;

const ProfileTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'bondups', label: 'Bondups', icon: Calendar },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'mutual', label: 'Mutual Friends', icon: Users },
  ];

  return (
    <View style={s.tabNavigation}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabButton, isActive && s.activeTabButton]}
            onPress={() => onTabChange(tab.key)}
          >
            <Icon size={16} color={isActive ? '#fff' : '#666'} />
            <Text style={[s.tabButtonText, isActive && s.activeTabButtonText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
  },
  tabButtonText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansMedium',
    color: '#666',
  },
  activeTabButtonText: {
    color: BRAND,
    fontFamily: 'PlusJakartaSansBold',
  },
});

export default ProfileTabs;