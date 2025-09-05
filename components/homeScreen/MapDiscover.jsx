import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Modal,
  Button,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import MultiSlider from "@ptomasroos/react-native-multi-slider";

const FALLBACK_REGION = {
  latitude: 37.78825, // San Francisco fallback
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapDiscoveryScreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filterSettings, setFilterSettings] = useState({
    gender: "any",
    ageRange: [18, 35],
    distance: 10, // in kilometers
  });
  const [errorMsg, setErrorMsg] = useState(null);

  // Get current user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        Alert.alert(
          "Location Permission Required",
          "Please enable location services to use this feature"
        );
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          maximumAge: 10000,
          timeout: 15000,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log("Error getting location:", error);
        setErrorMsg("Failed to get your current location");
      }
    })();
  }, []);

  // Fetch nearby users (mock data)
  useEffect(() => {
    if (userLocation) {
      const mockUsers = generateMockUsers(userLocation, filterSettings);
      setNearbyUsers(mockUsers);
    }
  }, [userLocation, filterSettings]);

  const region = userLocation
    ? { ...userLocation, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }
    : FALLBACK_REGION;

  return (
    <View style={{ flex: 1 }}>
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <MapView
          style={{ flex: 1 }}
          initialRegion={FALLBACK_REGION}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Current User Radius */}
          {userLocation && (
            <Circle
              center={userLocation}
              radius={filterSettings.distance * 1000}
              fillColor="rgba(255, 100, 100, 0.2)"
              strokeColor="rgba(255, 100, 100, 0.5)" 
            />
          )}

          {/* Nearby Users */}
          {nearbyUsers.map((user) => (
            <Marker
              key={user.id}
              coordinate={user.location}
              title={user.name}
              description={`Age: ${user.age}, Gender: ${user.gender}`}
            />
          ))}
        </MapView>

      )}

          
      {/* Filter Button */}
      <FilterButton onPress={() => setShowFilter(true)} />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        filters={filterSettings}
        onApply={(newFilters) => setFilterSettings(newFilters)}
        onClose={() => setShowFilter(false)}
      />
    </View>
  );
};

const FilterButton = ({ onPress }) => (
  <TouchableOpacity style={styles.filterButton} onPress={onPress}>
    <Text style={styles.filterButtonText}>Filter</Text>
  </TouchableOpacity>
);

const FilterModal = ({ visible, filters, onApply, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter Options</Text>

          <Text>Gender</Text>
          <Picker
            selectedValue={localFilters.gender}
            onValueChange={(value) =>
              setLocalFilters({ ...localFilters, gender: value })
            }
          >
            <Picker.Item label="Any" value="any" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>

          <Text>
            Age Range: {localFilters.ageRange[0]} - {localFilters.ageRange[1]}
          </Text>
          <MultiSlider
            min={18}
            max={100}
            values={localFilters.ageRange}
            onValuesChange={(values) =>
              setLocalFilters({ ...localFilters, ageRange: values })
            }
            step={1}
            allowOverlap={false}
            minMarkerDistance={1}
          />

          <Text>Distance: {localFilters.distance}km</Text>
          <MultiSlider
            min={1}
            max={100}
            values={[localFilters.distance]}
            onValuesChange={(values) =>
              setLocalFilters({ ...localFilters, distance: values[0] })
            }
            step={1}
          />

          <View style={styles.modalButtons}>
            <Button title="Apply" onPress={() => onApply(localFilters)} />
            <Button title="Cancel" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const generateMockUsers = (center, filters) => {
  const mockUsers = [];
  for (let i = 0; i < 20; i++) {
    const distance = Math.random() * filters.distance;
    const angle = Math.random() * Math.PI * 2;

    mockUsers.push({
      id: i,
      name: `User ${i}`,
      age: Math.floor(
        Math.random() * (filters.ageRange[1] - filters.ageRange[0]) +
          filters.ageRange[0]
      ),
      gender: ["male", "female", "other"][i % 3],
      location: {
        latitude: center.latitude + (distance / 111) * Math.cos(angle),
        longitude:
          center.longitude +
          (distance / (111 * Math.cos((center.latitude * Math.PI) / 180))) *
            Math.sin(angle),
      },
    });
  }
  return mockUsers.filter(
    (user) =>
      (filters.gender === "any" || user.gender === filters.gender) &&
      user.age >= filters.ageRange[0] &&
      user.age <= filters.ageRange[1]
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  filterButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterButtonText: {
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});

export default MapDiscoveryScreen;
