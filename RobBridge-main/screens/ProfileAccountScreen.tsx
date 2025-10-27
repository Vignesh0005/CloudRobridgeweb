import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { useAuth } from '../contexts/AuthContext';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'button' | 'input' | 'select';
  value?: boolean | string;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  onInputChange?: (value: string) => void;
}

const ProfileAccountScreen = () => {
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: 'phone-number',
      title: 'Phone Number',
      subtitle: '+1 (555) 123-4567',
      icon: 'call',
      type: 'button',
    },
    {
      id: 'role',
      title: 'Role',
      subtitle: 'admin',
      icon: 'shield',
      type: 'button',
    },
    {
      id: 'company',
      title: 'Company Name',
      subtitle: 'robridge technologies',
      icon: 'business',
      type: 'button',
    },
    {
      id: 'member-since',
      title: 'Member Since',
      subtitle: 'jan 2025',
      icon: 'calendar',
      type: 'button',
    },
    {
      id: 'security-level',
      title: 'Security Level',
      subtitle: 'standard',
      icon: 'lock-closed',
      type: 'button',
    },
    {
      id: 'change-password',
      title: 'Change Password',
      subtitle: 'Update your account password',
      icon: 'key',
      type: 'button',
      onPress: () => Alert.alert('Change Password', 'Password change functionality coming soon'),
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      subtitle: 'Receive alerts and updates',
      icon: 'notifications',
      type: 'toggle',
      value: true,
      onToggle: (value) => updateSetting('notifications', value),
    },
  ]);

  const updateSetting = (settingId: string, value: boolean | string) => {
    setSettings(prevSettings => 
      prevSettings.map(item => 
        item.id === settingId ? { ...item, value } : item
      )
    );
  };

  const toggleDrawer = () => {
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
      }
    } catch (error) {
      console.error('Error toggling drawer:', error);
    }
  };

  const renderSettingItem = (item: SettingItem) => {
    switch (item.type) {
      case 'toggle':
        return (
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <Switch
              value={item.value as boolean}
              onValueChange={item.onToggle}
              trackColor={{ false: COLORS.grayLight, true: COLORS.primary }}
              thumbColor={COLORS.textLight}
            />
          </View>
        );

      default:
        return (
          <TouchableOpacity style={styles.settingItem} onPress={item.onPress}>
            <View style={styles.settingInfo}>
              <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleDrawer}
          activeOpacity={0.5}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={28} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Account</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={40} color={COLORS.textLight} />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
              <Text style={styles.profileRole}>Administrator</Text>
            </View>
          </View>
        </View>

        {/* Profile & Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile & Account</Text>
          <View style={styles.sectionContent}>
            {settings.map((item, index) => (
              <View key={item.id} style={[
                styles.settingItemContainer,
                index === settings.length - 1 && styles.lastItem
              ]}>
                {renderSettingItem(item)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textLight,
    textAlign: 'center',
    marginLeft: -40,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.marginLarge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.margin,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileRole: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  section: {
    marginBottom: SIZES.marginLarge,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: SIZES.margin,
    flex: 1,
  },
  settingTitle: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default ProfileAccountScreen;
