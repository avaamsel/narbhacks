import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { requestForegroundPermissionsAsync, getCurrentPositionAsync } from "expo-location";

export default function LocationTrackerScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [travelMode, setTravelMode] = useState(null);
  const [showModeModal, setShowModeModal] = useState(true);

  const getLocation = async () => {
    setLoading(true);
    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        setLoading(false);
        return;
      }
      const loc = await getCurrentPositionAsync({});
      setLocation(loc);
      if (loc && loc.coords) {
        console.log("Location obtained:", loc.coords.latitude, loc.coords.longitude);
      }
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  // Travel Mode Selection Screen
  if (!travelMode && showModeModal) {
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Welcome to pathpal!</Text>
          <Text style={styles.modalDescription}>
            pathpal is a gamification style geolocation app intended to get users to explore the area around them and find fun new areas to frequent!
          </Text>
          <Text style={styles.modalSubtitle}>let's explore!</Text>
          
          <Text style={styles.travelModeTitle}>How are you exploring today?</Text>
          
          <TouchableOpacity
            style={[styles.travelModeButton, { backgroundColor: '#4a90e2' }]}
            onPress={() => { setTravelMode("walking"); setShowModeModal(false); }}
          >
            <Text style={styles.travelModeButtonText}>🚶 Walking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.travelModeButton, { backgroundColor: '#f5a623' }]}
            onPress={() => { setTravelMode("wheels"); setShowModeModal(false); }}
          >
            <Text style={styles.travelModeButtonText}>🛴 Wheels (bike, scooter, etc.)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Pathpal!</Text>
      <Text style={styles.subtitle}>Location tracking app</Text>
      
      {travelMode && (
        <View style={styles.travelModeInfo}>
          <Text style={styles.travelModeLabel}>Travel Mode</Text>
          <Text style={styles.travelModeValue}>
            {travelMode === "walking" ? "🚶 Walking" : "🛴 Wheels"}
          </Text>
        </View>
      )}

      <View style={styles.locationInfo}>
        <Text style={styles.locationTitle}>Your Location</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4a90e2" />
        ) : location && location.coords ? (
          <View style={styles.locationData}>
            <Text style={styles.locationText}>
              Latitude: {location.coords.latitude?.toFixed(6) || 'N/A'}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {location.coords.longitude?.toFixed(6) || 'N/A'}
            </Text>
          </View>
        ) : (
          <Text style={styles.noLocationText}>Location not available</Text>
        )}
        
        <TouchableOpacity style={styles.refreshButton} onPress={getLocation}>
          <Text style={styles.refreshButtonText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  userInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  locationInfo: {
    marginTop: 20,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 10,
  },
  locationData: {
    marginBottom: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  noLocationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  travelModeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  travelModeButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelModeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  travelModeInfo: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e0f2f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  travelModeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 5,
  },
  travelModeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 