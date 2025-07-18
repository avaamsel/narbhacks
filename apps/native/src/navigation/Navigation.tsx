import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CreateNoteScreen from "../screens/CreateNoteScreen";
import InsideNoteScreen from "../screens/InsideNoteScreen";
import LoginScreen from "../screens/LoginScreen";
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
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="InsideNoteScreen" component={InsideNoteScreen} />
        <Stack.Screen name="CreateNoteScreen" component={CreateNoteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
