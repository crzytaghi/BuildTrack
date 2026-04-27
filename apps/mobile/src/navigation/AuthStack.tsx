import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/AuthScreen';
import CompanySetupScreen from '../screens/CompanySetupScreen';

export type AuthStackParamList = {
  Auth: undefined;
  CompanySetup: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Auth" component={AuthScreen} />
    <Stack.Screen name="CompanySetup" component={CompanySetupScreen} />
  </Stack.Navigator>
);

export default AuthStack;
