import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/theme';
import { RootStackParamList, MainTabParamList } from '../types';

// Import screens (we'll create these next)
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import TasksScreen from '../screens/Tasks/TasksScreen';
import CreateItemScreen from '../screens/Create/CreateItemScreen';
import EditTaskScreen from '../screens/Tasks/EditTaskScreen';
import TaskDetailsScreen from '../screens/Tasks/TaskDetailsScreen';
import SkillsScreen from '../screens/Skills/SkillsScreen';
import RewardsScreen from '../screens/Rewards/RewardsScreen';
import CreateRewardScreen from '../screens/Rewards/CreateRewardScreen';
import AchievementsScreen from '../screens/Achievements/AchievementsScreen';
import CreateAchievementScreen from '../screens/Achievements/CreateAchievementScreen';
import FitnessScreen from '../screens/Fitness/FitnessScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Tasks':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Skills':
              iconName = focused ? 'flash' : 'flash-outline';
              break;
            case 'Rewards':
              iconName = focused ? 'gift' : 'gift-outline';
              break;
            case 'Achievements':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Fitness':
              iconName = focused ? 'fitness' : 'fitness-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 100,
          paddingBottom: 12,
          paddingTop: 12,
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.textLight,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Hero Dashboard' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksScreen}
        options={{ title: 'Quest Log' }}
      />
      <Tab.Screen 
        name="Skills" 
        component={SkillsScreen}
        options={{ title: 'Skills & Stats' }}
      />
      <Tab.Screen 
        name="Rewards" 
        component={RewardsScreen}
        options={{ title: 'Reward Shop' }}
      />
      <Tab.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
      <Tab.Screen 
        name="Fitness" 
        component={FitnessScreen}
        options={{ title: 'Fitness Tracker' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.textLight,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateTask" 
          component={CreateItemScreen}
          options={{ 
            title: 'Create New Item',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="EditTask" 
          component={EditTaskScreen}
          options={{ 
            title: 'Edit Quest',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="TaskDetails" 
          component={TaskDetailsScreen}
          options={{ title: 'Quest Details' }}
        />
        <Stack.Screen 
          name="CreateReward" 
          component={CreateRewardScreen}
          options={{ 
            title: 'Create Reward',
            presentation: 'modal'
          }}
        />
        <Stack.Screen 
          name="CreateAchievement" 
          component={CreateAchievementScreen}
          options={{ 
            title: 'Create Achievement',
            presentation: 'modal'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;