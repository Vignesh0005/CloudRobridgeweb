import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';

const { width } = Dimensions.get('window');

interface RackSettings {
  autoUpdate: boolean;
  notificationEnabled: boolean;
  lowCapacityThreshold: number;
  maxRacksPerSection: number;
  defaultCapacity: number;
  locationFormat: 'xyz' | 'alphanumeric';
  autoGenerateNames: boolean;
  namePrefix: string;
  enableBarcodeIntegration: boolean;
  syncInterval: number; // in minutes
}

const RackSettingsScreen: React.FC = () => {
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const [settings, setSettings] = useState<RackSettings>({
    autoUpdate: true,
    notificationEnabled: true,
    lowCapacityThreshold: 20,
    maxRacksPerSection: 10,
    defaultCapacity: 100,
    locationFormat: 'xyz',
    autoGenerateNames: true,
    namePrefix: 'Rack',
    enableBarcodeIntegration: true,
    syncInterval: 5,
  });

  const [showLocationFormatModal, setShowLocationFormatModal] = useState(false);
  const [showSyncIntervalModal, setShowSyncIntervalModal] = useState(false);

  const handleSettingChange = (key: keyof RackSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // Here you would typically save to backend
    Alert.alert('Success', 'Settings saved successfully');
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              autoUpdate: true,
              notificationEnabled: true,
              lowCapacityThreshold: 20,
              maxRacksPerSection: 10,
              defaultCapacity: 100,
              locationFormat: 'xyz',
              autoGenerateNames: true,
              namePrefix: 'Rack',
              enableBarcodeIntegration: true,
              syncInterval: 5,
            });
            Alert.alert('Success', 'Settings reset to default');
          },
        },
      ]
    );
  };

  const SettingRow: React.FC<{
    title: string;
    description?: string;
    children: React.ReactNode;
  }> = ({ title, description, children }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingControl}>
        {children}
      </View>
    </View>
  );

  const LocationFormatModal = () => (
    <Modal visible={showLocationFormatModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Location Format</Text>
          <Text style={styles.modalDescription}>
            Choose how rack locations are displayed and entered
          </Text>
          
          <TouchableOpacity
            style={[
              styles.optionButton,
              settings.locationFormat === 'xyz' && styles.selectedOption
            ]}
            onPress={() => {
              handleSettingChange('locationFormat', 'xyz');
              setShowLocationFormatModal(false);
            }}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>XYZ Coordinates</Text>
              <Text style={styles.optionDescription}>
                Use numeric coordinates (1, 2, 3)
              </Text>
            </View>
            {settings.locationFormat === 'xyz' && (
              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              settings.locationFormat === 'alphanumeric' && styles.selectedOption
            ]}
            onPress={() => {
              handleSettingChange('locationFormat', 'alphanumeric');
              setShowLocationFormatModal(false);
            }}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Alphanumeric</Text>
              <Text style={styles.optionDescription}>
                Use letters and numbers (A1, B2, C3)
              </Text>
            </View>
            {settings.locationFormat === 'alphanumeric' && (
              <Ionicons name="checkmark" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowLocationFormatModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SyncIntervalModal = () => (
    <Modal visible={showSyncIntervalModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sync Interval</Text>
          <Text style={styles.modalDescription}>
            How often to sync rack data with the server
          </Text>
          
          {[1, 5, 10, 15, 30].map((interval) => (
            <TouchableOpacity
              key={interval}
              style={[
                styles.optionButton,
                settings.syncInterval === interval && styles.selectedOption
              ]}
              onPress={() => {
                handleSettingChange('syncInterval', interval);
                setShowSyncIntervalModal(false);
              }}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{interval} minutes</Text>
                <Text style={styles.optionDescription}>
                  {interval === 1 ? 'Real-time updates' : `Update every ${interval} minutes`}
                </Text>
              </View>
              {settings.syncInterval === interval && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowSyncIntervalModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.toggleDrawer()}
        >
          <Ionicons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rack Settings</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Ionicons name="checkmark" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          
          <SettingRow
            title="Auto Update"
            description="Automatically update rack status from sensors"
          >
            <Switch
              value={settings.autoUpdate}
              onValueChange={(value) => handleSettingChange('autoUpdate', value)}
              trackColor={{ false: COLORS.grayLight, true: COLORS.primaryLight }}
              thumbColor={settings.autoUpdate ? COLORS.primary : COLORS.gray}
            />
          </SettingRow>

          <SettingRow
            title="Notifications"
            description="Receive notifications for rack status changes"
          >
            <Switch
              value={settings.notificationEnabled}
              onValueChange={(value) => handleSettingChange('notificationEnabled', value)}
              trackColor={{ false: COLORS.grayLight, true: COLORS.primaryLight }}
              thumbColor={settings.notificationEnabled ? COLORS.primary : COLORS.gray}
            />
          </SettingRow>

          <SettingRow
            title="Barcode Integration"
            description="Enable barcode scanning for rack management"
          >
            <Switch
              value={settings.enableBarcodeIntegration}
              onValueChange={(value) => handleSettingChange('enableBarcodeIntegration', value)}
              trackColor={{ false: COLORS.grayLight, true: COLORS.primaryLight }}
              thumbColor={settings.enableBarcodeIntegration ? COLORS.primary : COLORS.gray}
            />
          </SettingRow>
        </View>

        {/* Capacity Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capacity Settings</Text>
          
          <SettingRow
            title="Default Capacity"
            description="Default weight capacity for new racks (kg)"
          >
            <TextInput
              style={styles.numberInput}
              value={settings.defaultCapacity.toString()}
              onChangeText={(text) => handleSettingChange('defaultCapacity', parseInt(text) || 100)}
              keyboardType="numeric"
            />
          </SettingRow>

          <SettingRow
            title="Low Capacity Threshold"
            description="Alert when capacity drops below this percentage"
          >
            <TextInput
              style={styles.numberInput}
              value={settings.lowCapacityThreshold.toString()}
              onChangeText={(text) => handleSettingChange('lowCapacityThreshold', parseInt(text) || 20)}
              keyboardType="numeric"
            />
          </SettingRow>

          <SettingRow
            title="Max Racks Per Section"
            description="Maximum number of racks allowed per section"
          >
            <TextInput
              style={styles.numberInput}
              value={settings.maxRacksPerSection.toString()}
              onChangeText={(text) => handleSettingChange('maxRacksPerSection', parseInt(text) || 10)}
              keyboardType="numeric"
            />
          </SettingRow>
        </View>

        {/* Naming Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Naming Settings</Text>
          
          <SettingRow
            title="Auto Generate Names"
            description="Automatically generate rack names when adding new racks"
          >
            <Switch
              value={settings.autoGenerateNames}
              onValueChange={(value) => handleSettingChange('autoGenerateNames', value)}
              trackColor={{ false: COLORS.grayLight, true: COLORS.primaryLight }}
              thumbColor={settings.autoGenerateNames ? COLORS.primary : COLORS.gray}
            />
          </SettingRow>

          <SettingRow
            title="Name Prefix"
            description="Prefix for automatically generated rack names"
          >
            <TextInput
              style={styles.textInput}
              value={settings.namePrefix}
              onChangeText={(text) => handleSettingChange('namePrefix', text)}
              placeholder="Rack"
            />
          </SettingRow>

          <SettingRow
            title="Location Format"
            description="Format for rack location coordinates"
          >
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowLocationFormatModal(true)}
            >
              <Text style={styles.pickerButtonText}>
                {settings.locationFormat === 'xyz' ? 'XYZ Coordinates' : 'Alphanumeric'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          </SettingRow>
        </View>

        {/* Sync Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Settings</Text>
          
          <SettingRow
            title="Sync Interval"
            description="How often to sync with the server"
          >
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSyncIntervalModal(true)}
            >
              <Text style={styles.pickerButtonText}>
                {settings.syncInterval} minutes
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          </SettingRow>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={saveSettings}>
            <Ionicons name="save" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Save Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={resetSettings}>
            <Ionicons name="refresh" size={20} color={COLORS.error} />
            <Text style={[styles.actionButtonText, styles.resetButtonText]}>Reset to Default</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LocationFormatModal />
      <SyncIntervalModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.statusBarHeight + 10,
    paddingBottom: 15,
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
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.card,
    marginBottom: 10,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayDark,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: COLORS.grayDark,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: SIZES.body,
    backgroundColor: COLORS.inputBackground,
    color: COLORS.text,
    width: 80,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.grayDark,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: SIZES.body,
    backgroundColor: COLORS.inputBackground,
    color: COLORS.text,
    width: 120,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
    borderRadius: 6,
    backgroundColor: COLORS.inputBackground,
    minWidth: 120,
  },
  pickerButtonText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginRight: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.padding,
    marginVertical: 5,
    paddingVertical: 15,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  resetButtonText: {
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: width - 40,
    width: '100%',
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  modalDescription: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
    backgroundColor: COLORS.inputBackground,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default RackSettingsScreen;
