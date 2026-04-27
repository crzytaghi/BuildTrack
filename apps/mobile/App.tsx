import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import AppTabs from './src/navigation/AppTabs';

const RootNavigator = () => {
  const { token, companySetupRequired, booting } = useAuth();

  if (booting) return null;

  if (!token || companySetupRequired) {
    return <AuthStack />;
  }

  return <AppTabs />;
};

const App = () => (
  <AuthProvider>
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  </AuthProvider>
);

export default App;
