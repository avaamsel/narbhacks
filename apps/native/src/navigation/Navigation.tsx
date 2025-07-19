import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LocationTrackerScreen from "../screens/LocationTrackerScreen";

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        initialRouteName="LocationTrackerScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="LocationTrackerScreen" component={LocationTrackerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
