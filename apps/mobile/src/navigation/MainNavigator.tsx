import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { PodcastDetailScreen } from '../screens/podcast/PodcastDetailScreen';
import { EpisodeDetailScreen } from '../screens/podcast/EpisodeDetailScreen';

const Stack = createNativeStackNavigator();

export const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="PodcastDetail" component={PodcastDetailScreen} />
      <Stack.Screen name="EpisodeDetail" component={EpisodeDetailScreen} />
    </Stack.Navigator>
  );
};
