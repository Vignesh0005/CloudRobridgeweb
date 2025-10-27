import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { useAuth } from '../contexts/AuthContext';

interface ImageProcessorScreenProps {
  navigation: any;
}

const ImageProcessorScreen: React.FC<ImageProcessorScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Processing options state
  const [convertToGrayscale, setConvertToGrayscale] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);

  const toggleDrawer = () => {
    navigation.openDrawer();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const processImage = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setIsProcessing(true);

    // Simulate image processing
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Processing Complete!',
        'Image has been processed successfully',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const resetOptions = () => {
    setConvertToGrayscale(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
          <Ionicons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Image Processing</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Page Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            Upload images or capture from camera, then apply various filters and enhancements.
          </Text>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Section</Text>
          <View style={styles.uploadContainer}>
            <TouchableOpacity 
              style={styles.uploadCard} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="cloud-upload" size={40} color={COLORS.primary} />
              <Text style={styles.uploadTitle}>Upload Image</Text>
              <Text style={styles.uploadSubtitle}>from local system</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.uploadCard} 
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={40} color={COLORS.primary} />
              <Text style={styles.uploadTitle}>Capture from Camera</Text>
              <Text style={styles.uploadSubtitle}>take a photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Image</Text>
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Processing Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processing Options</Text>
          
          {/* Convert to Grayscale */}
          <View style={styles.optionContainer}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>Convert to Grayscale</Text>
              <Switch
                value={convertToGrayscale}
                onValueChange={setConvertToGrayscale}
                trackColor={{ false: COLORS.gray, true: COLORS.primary }}
                thumbColor={convertToGrayscale ? COLORS.white : COLORS.white}
              />
            </View>
          </View>

          {/* Brightness Slider */}
          <View style={styles.optionContainer}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>Brightness: {brightness}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={200}
              value={brightness}
              onValueChange={setBrightness}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.gray}
            />
          </View>

          {/* Contrast Slider */}
          <View style={styles.optionContainer}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>Contrast: {contrast}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={200}
              value={contrast}
              onValueChange={setContrast}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.gray}
            />
          </View>

          {/* Saturation Slider */}
          <View style={styles.optionContainer}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>Saturation: {saturation}%</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={200}
              value={saturation}
              onValueChange={setSaturation}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.gray}
            />
          </View>

          {/* Blur Slider */}
          <View style={styles.optionContainer}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionLabel}>Blur: {blur}px</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={20}
              value={blur}
              onValueChange={setBlur}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.gray}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
            onPress={processImage}
            disabled={isProcessing || !selectedImage}
            activeOpacity={0.7}
          >
            <Ionicons name="color-wand" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>
              {isProcessing ? 'Processing...' : 'Process Image'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetOptions}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Reset Options</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    paddingTop: SIZES.padding + 20, // Account for status bar
  },
  menuButton: {
    padding: SIZES.paddingSmall,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    padding: SIZES.paddingSmall,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  descriptionContainer: {
    marginVertical: SIZES.padding,
  },
  description: {
    fontSize: SIZES.body,
    color: COLORS.white,
    textAlign: 'center',
  },
  section: {
    marginBottom: SIZES.padding * 2,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.padding,
  },
  uploadContainer: {
    flexDirection: 'row',
    gap: SIZES.padding,
    flexWrap: 'wrap',
  },
  uploadCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray,
    borderStyle: 'dashed',
    minHeight: 120,
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: SIZES.padding,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.white,
    marginTop: SIZES.paddingSmall,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.radius,
  },
  removeImageButton: {
    position: 'absolute',
    top: SIZES.padding,
    right: SIZES.padding,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  optionContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  optionLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding * 2,
    gap: SIZES.padding,
    flexWrap: 'wrap',
  },
  processButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  processButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
});

export default ImageProcessorScreen;