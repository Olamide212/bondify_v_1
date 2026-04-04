import { Calendar, Users } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProfileTabs = ({ activeTab, onTabChange, isOwnProfile }) => {
  const allTabs = [
    { key: 'bondups', label: 'Bondups', icon: Calendar },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'mutual', label: 'Mutual Friends', icon: Users },
  ];

  // For other users, don't show the 'friends' tab
  const tabs = isOwnProfile ? allTabs : allTabs.filter(tab => tab.key !== 'friends');

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
            {/* <Icon size={16} color={isActive ? '#000' : '#666'} /> */}
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
    borderBottomColor: '#333333',
    // marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 20
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
    borderBottomColor: '#000',
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: 'OutfitMedium',
    color: '#9CA3AF',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
    fontFamily: 'OutfitBold',
  },
});

export default ProfileTabs;