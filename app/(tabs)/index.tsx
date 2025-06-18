
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [averageSpeed, setAverageSpeed] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Use refs to store running totals to avoid re-renders on every update
  const totalSpeed = useRef<number>(0);
  const sampleCount = useRef<number>(0);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (loc) => {
          setLocation(loc);
          if (loc.coords.speed && loc.coords.speed > 0) { // Check for valid speed
            const currentSpeed = loc.coords.speed * 3.6; // km/h
            setSpeed(currentSpeed);

            if (isTracking) {
              if (currentSpeed > maxSpeed) {
                setMaxSpeed(currentSpeed);
              }
              // Update running totals
              totalSpeed.current += currentSpeed;
              sampleCount.current += 1;
              // Update the displayed average speed
              setAverageSpeed(totalSpeed.current / sampleCount.current);
            }
          }
        }
      );
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isTracking, maxSpeed]); // Simplified dependencies

  const handleToggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
    } else {
      // Reset all stats when starting a new session
      setMaxSpeed(0);
      setAverageSpeed(0);
      totalSpeed.current = 0;
      sampleCount.current = 0;
      setIsTracking(true);
    }
  };

  let text = '...';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = `${speed.toFixed(1)}`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.speedoText}>{text}</Text>
      <Text style={styles.unitText}>km/h</Text>
      <TouchableOpacity
        onPress={handleToggleTracking}
        style={[styles.button, { backgroundColor: isTracking ? 'red' : 'green' }]}
      >
        <Text style={styles.buttonText}>{isTracking ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg Speed</Text>
          <Text style={styles.statValue}>{averageSpeed.toFixed(1)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Max Speed</Text>
          <Text style={styles.statValue}>{maxSpeed.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedoText: {
    color: 'white',
    fontSize: 120,
    fontWeight: 'bold',
  },
  unitText: {
    color: 'white',
    fontSize: 30,
    marginBottom: 20,
  },
  button: {
    width: '80%',
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'white',
    fontSize: 20,
  },
  statValue: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
});
