import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MapPin, Heart, Users, Filter, Search } from "lucide-react-native";

const mockUsers = [
  {
    id: "1",
    name: "Alex Morgan",
    age: 28,
    distance: 2,
    location: { latitude: 37.78825, longitude: -122.4324 },
    isOnline: true,
  },
  {
    id: "2",
    name: "Taylor Swift",
    age: 33,
    distance: 5,
    location: { latitude: 37.78525, longitude: -122.4254 },
    isOnline: true,
  },
  {
    id: "3",
    name: "Jordan Lee",
    age: 30,
    distance: 8,
    location: { latitude: 37.77825, longitude: -122.4424 },
    isOnline: false,
  },
  {
    id: "4",
    name: "Casey Smith",
    age: 25,
    distance: 12,
    location: { latitude: 37.79225, longitude: -122.4124 },
    isOnline: true,
  },
];

const Map = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUserLocation = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#6B7280" size={20} />
          <Text style={styles.searchText}>Search this area</Text>
        </View>
        <View style={styles.headerActions}>
          <Filter color="#EC4899" size={24} />
        </View>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={currentUserLocation}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {mockUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={user.location}
            title={`${user.name}, ${user.age}`}
            description={`${user.distance} km away`}
            pinColor={user.isOnline ? "blue" : "purple"}
          />
        ))}
      </MapView>

      {/* User Cards */}
      <FlatList
        data={mockUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.userCardsContainer}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userImageContainer}>
              <View style={styles.userImagePlaceholder} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {item.name}, {item.age}
              </Text>
              <View style={styles.userDetails}>
                <MapPin color="#6B7280" size={14} />
                <Text style={styles.userDistance}>{item.distance} km away</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.actionButton}>
          <Users color="#8B5CF6" size={28} />
        </View>
        <View style={styles.actionButton}>
          <Heart color="#EC4899" size={28} />
        </View>
      </View>
    </View>
  );
};

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#121212",
    elevation: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginRight: 12,
  },
  searchText: {
    color: '#9CA3AF',
    marginLeft: 8,
    fontSize: 16,
  },
  headerActions: {
    padding: 8,
  },
  map: {
    width: "100%",
    height: height * 0.4,
  },
  userCardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  userImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
    backgroundColor: "#D1D5DB",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#E5E7EB',
    marginBottom: 4,
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDistance: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E1E1E',
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Map;
