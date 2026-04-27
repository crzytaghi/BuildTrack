import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';

export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
};

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

const ProjectsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProjectsList" component={ProjectsScreen} />
    <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
  </Stack.Navigator>
);

export default ProjectsStack;
