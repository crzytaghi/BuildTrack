import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import DashboardStack from './DashboardStack';
import ProjectsStack from './ProjectsStack';
import ExpensesScreen from '../screens/ExpensesScreen';
import VendorsScreen from '../screens/VendorsScreen';

export type AppTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  Expenses: undefined;
  Vendors: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { focused: IoniconName; outline: IoniconName }> = {
  Dashboard: { focused: 'grid', outline: 'grid-outline' },
  Projects: { focused: 'folder', outline: 'folder-outline' },
  Expenses: { focused: 'receipt', outline: 'receipt-outline' },
  Vendors: { focused: 'people', outline: 'people-outline' },
};

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.cardBg,
        borderTopColor: colors.border,
        borderTopWidth: 1,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
      tabBarIcon: ({ focused, size }) => {
        const icons = TAB_ICONS[route.name];
        const name = focused ? icons.focused : icons.outline;
        return <Ionicons name={name} size={size} color={focused ? colors.primary : colors.textMuted} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Projects" component={ProjectsStack} />
    <Tab.Screen name="Expenses" component={ExpensesScreen} />
    <Tab.Screen name="Vendors" component={VendorsScreen} />
  </Tab.Navigator>
);

export default AppTabs;
