import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Linking,
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

interface SettingSection {
  id: string;
  title: string;
  items: SettingItem[];
}

const SettingsScreen = () => {
  const [settings, setSettings] = useState<SettingSection[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
  });
  
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { user, logout } = useAuth();

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = () => {
    const settingsData: SettingSection[] = [
      {
        id: 'profile',
        title: 'Profile & Account',
        items: [
          {
            id: 'profile-account',
            title: 'Profile & Account',
            subtitle: 'Manage your profile and account settings',
            icon: 'person',
            type: 'button',
            onPress: () => navigation.navigate('ProfileAccount'),
          },
        ],
      },
      {
        id: 'app',
        title: 'App Settings',
        items: [
          {
            id: 'dark-mode',
            title: 'Dark Mode',
            subtitle: 'Use dark theme',
            icon: 'moon',
            type: 'toggle',
            value: false,
            onToggle: (value) => updateSetting('dark-mode', value),
          },
          {
            id: 'auto-save',
            title: 'Auto Save',
            subtitle: 'Automatically save your work',
            icon: 'save',
            type: 'toggle',
            value: true,
            onToggle: (value) => updateSetting('auto-save', value),
          },
          {
            id: 'language',
            title: 'Language',
            subtitle: 'English (US)',
            icon: 'language',
            type: 'select',
            onPress: () => Alert.alert('Language', 'Language selection coming soon'),
          },
          {
            id: 'units',
            title: 'Units',
            subtitle: 'Metric',
            icon: 'scale',
            type: 'select',
            onPress: () => Alert.alert('Units', 'Unit selection coming soon'),
          },
        ],
      },
      {
        id: 'robot',
        title: 'Robot Control',
        items: [
          {
            id: 'auto-connect',
            title: 'Auto Connect',
            subtitle: 'Automatically connect to robots',
            icon: 'wifi',
            type: 'toggle',
            value: false,
            onToggle: (value) => updateSetting('auto-connect', value),
          },
          {
            id: 'safety-mode',
            title: 'Safety Mode',
            subtitle: 'Enable safety restrictions',
            icon: 'shield-checkmark',
            type: 'toggle',
            value: true,
            onToggle: (value) => updateSetting('safety-mode', value),
          },
          {
            id: 'connection-timeout',
            title: 'Connection Timeout',
            subtitle: '30 seconds',
            icon: 'timer',
            type: 'input',
            value: '30',
            onInputChange: (value) => updateSetting('connection-timeout', value),
          },
        ],
      },
      {
        id: 'data',
        title: 'Data & Storage',
        items: [
          {
            id: 'sync-data',
            title: 'Sync Data',
            subtitle: 'Sync with cloud storage',
            icon: 'cloud-upload',
            type: 'toggle',
            value: true,
            onToggle: (value) => updateSetting('sync-data', value),
          },
          {
            id: 'cache-size',
            title: 'Cache Size',
            subtitle: '256 MB',
            icon: 'hardware-chip',
            type: 'select',
            onPress: () => Alert.alert('Cache Size', 'Cache size selection coming soon'),
          },
          {
            id: 'clear-cache',
            title: 'Clear Cache',
            subtitle: 'Free up storage space',
            icon: 'trash',
            type: 'button',
            onPress: () => clearCache(),
          },
        ],
      },
      {
        id: 'support',
        title: 'Support & About',
        items: [
          {
            id: 'help',
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            icon: 'help-circle',
            type: 'button',
            onPress: () => openHelp(),
          },
          {
            id: 'feedback',
            title: 'Send Feedback',
            subtitle: 'Help us improve the app',
            icon: 'chatbubble-ellipses',
            type: 'button',
            onPress: () => openFeedback(),
          },
          {
            id: 'about',
            title: 'About Robridge',
            subtitle: 'Version 1.0.0',
            icon: 'information-circle',
            type: 'button',
            onPress: () => setShowAboutModal(true),
          },
        ],
      },
    ];

    setSettings(settingsData);
  };

  const updateSetting = (settingId: string, value: boolean | string) => {
    setSettings(prevSettings => 
      prevSettings.map(section => ({
        ...section,
        items: section.items.map(item => 
          item.id === settingId ? { ...item, value } : item
        ),
      }))
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Cache', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          }
        },
      ]
    );
  };

  const openHelp = () => {
    Alert.alert(
      'Help & Support',
              'For help and support, please contact us at:\n\nEmail: support@robridge.com\nPhone: +1 (555) 123-4567',
      [
        { text: 'Copy Email', onPress: () => Alert.alert('Copied', 'Email copied to clipboard') },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const openFeedback = () => {
    Alert.alert(
      'Send Feedback',
              'We\'d love to hear your feedback! Please email us at feedback@robridge.com',
      [
        { text: 'Copy Email', onPress: () => Alert.alert('Copied', 'Email copied to clipboard') },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const handleLogout = () => {
    console.log('SettingsScreen: Logout button pressed');
    console.log('SettingsScreen: logout function available:', typeof logout);
    if (typeof logout !== 'function') {
      console.error('SettingsScreen: logout function is not available');
      return;
    }
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            console.log('SettingsScreen: Logout confirmed, calling logout function');
            try {
              logout();
              Alert.alert('Logged Out', 'You have been successfully logged out');
            } catch (error) {
              console.error('SettingsScreen: Error calling logout:', error);
            }
          }
        },
      ]
    );
  };

  const toggleDrawer = () => {
    console.log('SettingsScreen: Menu button pressed - attempting to toggle drawer');
    console.log('SettingsScreen: navigation object:', navigation);
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('SettingsScreen: Drawer toggled successfully');
      } else {
        console.error('SettingsScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('SettingsScreen: Error toggling drawer:', error);
    }
  };

  const saveProfile = () => {
    // In a real app, this would save to backend
    Alert.alert('Success', 'Profile updated successfully');
    setShowProfileModal(false);
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

      case 'input':
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
            <TextInput
              style={styles.settingInput}
              value={item.value as string}
              onChangeText={item.onInputChange}
              keyboardType="numeric"
              placeholder="Enter value"
              placeholderTextColor={COLORS.textSecondary}
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
          onPress={() => {
            console.log('SettingsScreen: Menu button TouchableOpacity pressed');
            toggleDrawer();
          }}
          activeOpacity={0.5}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={28} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => {
              console.log('SettingsScreen: Logout button TouchableOpacity pressed');
              handleLogout();
            }}
            activeOpacity={0.5}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
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
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Ionicons name="create" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settings.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item) => (
                <View key={item.id} style={styles.settingItemContainer}>
                  {renderSettingItem(item)}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionContainer}>
                  <Text style={styles.versionText}>Robridge Mobile v1.0.0</Text>
        <Text style={styles.versionSubtext}>© 2024 Robridge Technologies</Text>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={profileData.email}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.aboutModalOverlay}>
          <View style={styles.aboutModal}>
            <View style={styles.aboutHeader}>
              <Ionicons name="information-circle" size={64} color={COLORS.primary} />
              <Text style={styles.aboutTitle}>Robridge Mobile</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            </View>
            
            <View style={styles.aboutContent}>
              <Text style={styles.aboutDescription}>
                Robridge Mobile is a comprehensive robot control and management application designed for industrial automation and robotics professionals.
              </Text>
              
              <View style={styles.aboutFeatures}>
                <Text style={styles.aboutFeaturesTitle}>Key Features:</Text>
                <Text style={styles.aboutFeature}>• Robot Control & Monitoring</Text>
                <Text style={styles.aboutFeature}>• Barcode Management</Text>
                <Text style={styles.aboutFeature}>• Image Processing</Text>
                <Text style={styles.aboutFeature}>• Real-time Telemetry</Text>
                <Text style={styles.aboutFeature}>• System Health Monitoring</Text>
              </View>

              <TouchableOpacity
                style={styles.websiteButton}
                onPress={() => Linking.openURL('https://robridge.com')}
              >
                <Text style={styles.websiteButtonText}>Visit Website</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeAboutButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.closeAboutButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  editProfileButton: {
    padding: SIZES.marginSmall,
    backgroundColor: COLORS.primary + '20',
    borderRadius: SIZES.radiusSmall,
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
  settingInput: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.marginSmall,
    minWidth: 80,
    textAlign: 'center',
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.marginLarge,
  },
  versionText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.padding,
  },
  inputGroup: {
    marginBottom: SIZES.marginLarge,
  },
  inputLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.marginLarge,
  },
  saveButtonText: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  aboutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutModal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
  },
  aboutTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.margin,
  },
  aboutVersion: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SIZES.marginSmall,
  },
  aboutContent: {
    width: '100%',
    marginBottom: SIZES.marginLarge,
  },
  aboutDescription: {
    fontSize: SIZES.body,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SIZES.marginLarge,
  },
  aboutFeatures: {
    marginBottom: SIZES.marginLarge,
  },
  aboutFeaturesTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  aboutFeature: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.marginSmall,
  },
  websiteButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  websiteButtonText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  closeAboutButton: {
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.padding,
  },
  closeAboutButtonText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default SettingsScreen;
