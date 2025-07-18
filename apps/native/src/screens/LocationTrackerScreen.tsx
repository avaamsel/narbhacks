import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as Location from "expo-location";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

export default function LocationTrackerScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const saveLocation = useMutation(api.locations.saveLocation);

  const getLocationAndSend = async () => {
    setLoading(true);
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        setLoading(false);
        return;
      }
      // Get current location
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      // Send to Convex
      await saveLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: Date.now(),
      });
      Alert.alert("Success", "Location sent to backend!");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocationAndSend();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Tracker</Text>
      {loading && <ActivityIndicator size="large" color="#0D87E1" />}
      {location && (
        <View style={styles.infoBox}>
          <Text>Latitude: {location.coords.latitude}</Text>
          <Text>Longitude: {location.coords.longitude}</Text>
        </View>
      )}
      <Button title="Refresh Location" onPress={getLocationAndSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  infoBox: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f0f4f8",
    alignItems: "center",
  },
}); 