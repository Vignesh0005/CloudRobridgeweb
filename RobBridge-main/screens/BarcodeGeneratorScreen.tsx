import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Share,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { API_URLS, SERVER_CONFIG } from '../config/server';

interface BarcodeType {
  id: string;
  name: string;
  description: string;
  maxLength: number;
  example: string;
}

const barcodeTypes: BarcodeType[] = [
  {
    id: '1d',
    name: '1D Barcode',
    description: 'Linear barcode (Code128, EAN13, etc.)',
    maxLength: 50,
    example: 'ABC123',
  },
  {
    id: 'qr',
    name: '2D QR Code',
    description: 'Quick Response code (text, URL, etc.)',
    maxLength: 100,
    example: 'https://example.com',
  },
];

// Generate unique ID for generated barcodes
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const BarcodeGeneratorScreen = () => {
  const [selectedType, setSelectedType] = useState<BarcodeType>(barcodeTypes[0]);
  const [inputText, setInputText] = useState('');
  const [productName, setProductName] = useState('');
  const [productId, setProductId] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [generatedBarcodes, setGeneratedBarcodes] = useState<Array<{
    id: string;
    type: string;
    data: string;
    timestamp: string;
    filename?: string;
    barcode_id?: string;
    product_name?: string;
    product_id?: string;
    price?: string;
    location?: string;
    category?: string;
    source?: string;
  }>>([]);
  const [scannedBarcodes, setScannedBarcodes] = useState<Array<{
    id: string;
    type: string;
    data: string;
    timestamp: string;
    product_name?: string;
    product_id?: string;
    price?: string;
    location?: string;
    category?: string;
    source?: string;
  }>>([]);
  const [currentBarcode, setCurrentBarcode] = useState<{
    id: string;
    type: string;
    data: string;
    timestamp: string;
    filename?: string;
    barcode_id?: string;
  } | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBarcodeImage, setShowBarcodeImage] = useState(false);
  const [selectedBarcodeImage, setSelectedBarcodeImage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const navigation = useNavigation<RootDrawerNavigationProp>();

  // Check connection status with Python server
  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(API_URLS.HEALTH, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    }
  };

  // Retry connection function
  const retryConnection = async () => {
    setIsRetrying(true);
    await checkConnection();
    setTimeout(() => setIsRetrying(false), 1000);
  };

  // Check connection on component mount and every 10 seconds
  useEffect(() => {
    checkConnection();
    loadAllBarcodes(); // Load history on component mount
    loadScannedBarcodes(); // Load scanned barcodes
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load all barcodes from database
  const loadAllBarcodes = async () => {
    try {
      // First login to get token
      const loginResponse = await fetch(API_URLS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
        }),
      });
      
      const loginResult = await loginResponse.json();
      if (!loginResult.success) {
        throw new Error('Login failed');
      }
      
      const token = loginResult.token;
      
      const response = await fetch(API_URLS.LIST_BARCODES, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        const formattedBarcodes = result.data.map((barcode: any) => ({
          id: barcode.barcode_id,
          type: barcode.barcode_type.toUpperCase(),
          data: barcode.barcode_data,
          timestamp: new Date(barcode.created_at).toLocaleString(), // Show full date and time
          filename: barcode.file_path,
          barcode_id: barcode.barcode_id,
          product_name: barcode.product_name || 'N/A',
          product_id: barcode.product_id || 'N/A',
          price: barcode.price || 'N/A',
          location: barcode.location || 'N/A',
          category: barcode.category || 'N/A',
          source: 'generated',
        }));
        setGeneratedBarcodes(formattedBarcodes);
      }
    } catch (error) {
      console.error('Error loading barcodes:', error);
    }
  };

  // Load scanned barcodes from AsyncStorage (if available)
  const loadScannedBarcodes = async () => {
    try {
      // For now, we'll use a simple approach - in a real app, you'd use AsyncStorage
      // This is a placeholder for scanned barcodes that would be persisted
      setScannedBarcodes([]);
    } catch (error) {
      console.error('Error loading scanned barcodes:', error);
    }
  };

  // Get combined history of all barcodes
  const getAllBarcodes = () => {
    const combined = [...generatedBarcodes, ...scannedBarcodes];
    // Sort by timestamp (newest first)
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const toggleDrawer = () => {
    console.log('BarcodeGeneratorScreen: Menu button pressed - attempting to toggle drawer');
    console.log('BarcodeGeneratorScreen: navigation object:', navigation);
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('BarcodeGeneratorScreen: Drawer toggled successfully');
      } else {
        console.error('BarcodeGeneratorScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('BarcodeGeneratorScreen: Error toggling drawer:', error);
    }
  };

  const generateBarcode = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter some text to generate a barcode');
      return;
    }

    if (inputText.length > selectedType.maxLength) {
      Alert.alert('Error', `Text is too long for ${selectedType.name}. Maximum length is ${selectedType.maxLength} characters.`);
      return;
    }

    setIsGenerating(true);

    try {
      // Prepare metadata for the Python backend
      const metadata = {
        product_name: productName || inputText,
        product_id: productId || 'N/A',
        price: price || 'N/A',
        location: location || 'N/A',
        category: category || 'N/A',
      };

      // Create structured barcode data that includes product information
      const structuredData = {
        original_data: inputText,
        product_name: productName || inputText,
        product_id: productId || 'N/A',
        price: price || 'N/A',
        location: location || 'N/A',
        category: category || 'N/A',
        source: 'mobile_generator',
        timestamp: new Date().toISOString()
      };

      // Use the structured data as the barcode content
      const barcodeData = JSON.stringify(structuredData);

      // Determine barcode type for backend
      const backendType = selectedType.id === '1d' ? 'code128' : 'qr';

      // First login to get token
      const loginResponse = await fetch(API_URLS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
        }),
      });
      
      const loginResult = await loginResponse.json();
      if (!loginResult.success) {
        throw new Error('Login failed');
      }
      
      const token = loginResult.token;

      // Call Python backend API
      const response = await fetch(API_URLS.GENERATE_BARCODE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: barcodeData,
          type: backendType,
          source: 'mobile',
          metadata: metadata,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Extract filename from the full path
        const filename = result.filename ? result.filename.split('/').pop() : null;
        const imageUrl = filename ? API_URLS.GET_BARCODE_IMAGE(filename) : null;
        
        const newBarcode = {
          id: generateUniqueId(),
          type: selectedType.name,
          data: inputText,
          timestamp: new Date().toLocaleTimeString(),
          filename: result.filename,
          barcode_id: result.barcode_id,
          imageUrl: imageUrl,
        };

        // Set current barcode to display
        setCurrentBarcode(newBarcode);
        
        // Set the image URL for display
        if (imageUrl) {
          setSelectedBarcodeImage(imageUrl);
          setShowBarcodeImage(true);
        }
        
        // Add to history
        setGeneratedBarcodes(prev => [newBarcode, ...prev]);
        
        // Clear form
        setInputText('');
        setProductName('');
        setProductId('');
        setPrice('');
        setLocation('');
        setCategory('');

        Alert.alert(
          'Barcode Generated!',
          `${selectedType.name} barcode created successfully.\n\nData: ${inputText}`,
          [
            { text: 'Generate Another', onPress: () => {} },
            { text: 'View History', onPress: () => setShowHistory(true) },
            { text: 'OK', style: 'default' },
          ]
        );
      } else {
        Alert.alert('Error', `Failed to generate barcode: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
      Alert.alert('Error', 'Failed to connect to barcode generator. Please make sure the Python server is running.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectBarcodeType = (type: BarcodeType) => {
    setSelectedType(type);
    setInputText(type.example);
    setShowTypeSelector(false);
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all generated barcodes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setGeneratedBarcodes([]) },
      ]
    );
  };

  const shareBarcode = async (barcode: any) => {
    try {
      await Share.share({
        message: `Generated ${barcode.type} barcode:\nData: ${barcode.data}\nGenerated at: ${barcode.timestamp}`,
        title: 'Generated Barcode',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share barcode');
    }
  };

  const deleteBarcode = (id: string) => {
    setGeneratedBarcodes(prev => prev.filter(barcode => barcode.id !== id));
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Barcode Generator</Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Connection Status Indicator */}
          <View style={styles.connectionIndicator}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
            {!isConnected && (
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={retryConnection}
                disabled={isRetrying}
              >
                <Ionicons 
                  name={isRetrying ? "refresh" : "refresh-outline"} 
                  size={12} 
                  color={COLORS.textLight} 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(true)}>
            <Ionicons name="time" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Status Section */}
        {!isConnected && (
          <View style={styles.connectionStatusSection}>
            <View style={styles.connectionStatusCard}>
              <Ionicons name="warning" size={24} color={COLORS.error} />
              <View style={styles.connectionStatusContent}>
                <Text style={styles.connectionStatusTitle}>Server Disconnected</Text>
                <Text style={styles.connectionStatusText}>
                  Unable to connect to Python barcode server. Make sure the server is running on 192.168.0.61:5001
                </Text>
                <TouchableOpacity 
                  style={[styles.retryConnectionButton, isRetrying && styles.retryConnectionButtonDisabled]} 
                  onPress={retryConnection}
                  disabled={isRetrying}
                >
                  <Ionicons 
                    name={isRetrying ? "refresh" : "refresh-outline"} 
                    size={20} 
                    color={COLORS.textLight} 
                  />
                  <Text style={styles.retryConnectionButtonText}>
                    {isRetrying ? 'Retrying...' : 'Retry Connection'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Barcode Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Barcode Type</Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={() => setShowTypeSelector(true)}
            activeOpacity={0.7}
          >
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>{selectedType.name}</Text>
              <Text style={styles.typeDescription}>{selectedType.description}</Text>
            </View>
            <Ionicons name="chevron-down" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Data</Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${selectedType.name} data (max ${selectedType.maxLength} chars)`}
            placeholderTextColor={COLORS.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            maxLength={selectedType.maxLength}
            multiline={selectedType.id === 'qr'}
            numberOfLines={selectedType.id === 'qr' ? 3 : 1}
          />
          <Text style={styles.charCount}>
            {inputText.length}/{selectedType.maxLength} characters
          </Text>
          
          {selectedType.example && (
            <TouchableOpacity
              style={styles.exampleButton}
              onPress={() => setInputText(selectedType.example)}
            >
              <Text style={styles.exampleText}>Use example: {selectedType.example}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Metadata Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information (Optional)</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Product Name"
            placeholderTextColor={COLORS.textSecondary}
            value={productName}
            onChangeText={setProductName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Product ID"
            placeholderTextColor={COLORS.textSecondary}
            value={productId}
            onChangeText={setProductId}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Price"
            placeholderTextColor={COLORS.textSecondary}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location (e.g., Warehouse A or 12.3,45.6,78.9)"
            placeholderTextColor={COLORS.textSecondary}
            value={location}
            onChangeText={setLocation}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Category"
            placeholderTextColor={COLORS.textSecondary}
            value={category}
            onChangeText={setCategory}
          />
        </View>

        {/* Generate Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={generateBarcode}
            activeOpacity={0.8}
            disabled={!inputText.trim() || isGenerating}
          >
            <Ionicons name={isGenerating ? "hourglass" : "qr-code"} size={32} color={COLORS.textLight} />
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate Barcode'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Generated Barcode */}
        {currentBarcode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generated Barcode</Text>
            <View style={styles.currentBarcodeContainer}>
              <View style={styles.barcodeInfo}>
                <Text style={styles.barcodeType}>{currentBarcode.type}</Text>
                <Text style={styles.barcodeData}>{currentBarcode.data}</Text>
                <Text style={styles.barcodeTime}>Generated: {currentBarcode.timestamp}</Text>
              </View>
              {currentBarcode.filename && (
                <View style={styles.barcodeImageContainer}>
                  <Text style={styles.barcodeImageText}>Barcode Image:</Text>
                  <Text style={styles.barcodeFilename}>{currentBarcode.filename}</Text>
                  <TouchableOpacity
                    style={styles.viewBarcodeButton}
                    onPress={() => {
                      // Show the actual barcode image
                      // Extract just the filename without the 'barcodes/' prefix
                      const filename = currentBarcode.filename?.split('/').pop() || currentBarcode.filename;
                      setSelectedBarcodeImage(API_URLS.GET_BARCODE(filename));
                      setShowBarcodeImage(true);
                    }}
                  >
                    <Text style={styles.viewBarcodeButtonText}>View Barcode</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="qr-code" size={24} color={COLORS.primary} />
              <Text style={styles.statNumber}>{getAllBarcodes().length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={COLORS.secondary} />
              <Text style={styles.statNumber}>
                {getAllBarcodes().length > 0 ? 'Today' : 'None'}
              </Text>
              <Text style={styles.statLabel}>Last Activity</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        {getAllBarcodes().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => setShowHistory(true)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {getAllBarcodes().slice(0, 3).map((barcode) => (
              <View key={barcode.id} style={styles.recentItem}>
                <View style={styles.recentInfo}>
                  <Ionicons name="qr-code" size={24} color={COLORS.primary} />
                  <View style={styles.recentDetails}>
                    <Text style={styles.recentType}>{barcode.type}</Text>
                    <Text style={styles.recentData}>{barcode.data}</Text>
                    <Text style={styles.recentTime}>{barcode.timestamp}</Text>
                  </View>
                </View>
                <View style={styles.recentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => shareBarcode(barcode)}
                  >
                    <Ionicons name="share" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteBarcode(barcode.id)}
                  >
                    <Ionicons name="trash" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Barcode Type Selector Modal */}
      <Modal
        visible={showTypeSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Barcode Type</Text>
            <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {barcodeTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeOption,
                  selectedType.id === type.id && styles.typeOptionSelected
                ]}
                onPress={() => selectBarcodeType(type)}
              >
                <View style={styles.typeOptionContent}>
                  <Text style={styles.typeOptionName}>{type.name}</Text>
                  <Text style={styles.typeOptionDescription}>{type.description}</Text>
                  <Text style={styles.typeOptionExample}>Example: {type.example}</Text>
                </View>
                {selectedType.id === type.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onShow={loadAllBarcodes}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generation History</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={clearHistory}>
                <Ionicons name="trash" size={24} color={COLORS.error} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {getAllBarcodes().length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="qr-code" size={64} color={COLORS.gray} />
                <Text style={styles.emptyText}>No barcodes yet</Text>
                <Text style={styles.emptySubtext}>Start generating or scanning barcodes to see them here</Text>
              </View>
            ) : (
              getAllBarcodes().map((barcode) => (
                <View key={barcode.id} style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <Ionicons name="qr-code" size={24} color={COLORS.primary} />
                    <View style={styles.historyDetails}>
                      <Text style={styles.historyType}>{barcode.type}</Text>
                      <Text style={styles.historyData}>{barcode.data}</Text>
                      {barcode.product_name && barcode.product_name !== 'N/A' && (
                        <Text style={styles.historyProduct}>Product: {barcode.product_name}</Text>
                      )}
                      {barcode.price && barcode.price !== 'N/A' && (
                        <Text style={styles.historyPrice}>Price: {barcode.price}</Text>
                      )}
                      <Text style={styles.historyTime}>{barcode.timestamp}</Text>
                    </View>
                  </View>
                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => shareBarcode(barcode)}
                    >
                      <Ionicons name="share" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteBarcode(barcode.id)}
                    >
                      <Ionicons name="trash" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Barcode Image Modal */}
      <Modal
        visible={showBarcodeImage}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowBarcodeImage(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContainer}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Generated Barcode</Text>
              <TouchableOpacity
                onPress={() => setShowBarcodeImage(false)}
                style={styles.closeImageButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {selectedBarcodeImage && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedBarcodeImage }}
                  style={styles.barcodeImage}
                  resizeMode="contain"
                />
              </View>
            )}
            
            <TouchableOpacity
              style={styles.closeImageModalButton}
              onPress={() => setShowBarcodeImage(false)}
            >
              <Text style={styles.closeImageModalButtonText}>Close</Text>
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
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minHeight: 80,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SIZES.marginSmall,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    maxWidth: 100,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 4,
    padding: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  viewAllText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  typeSelector: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  typeDescription: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.body,
    color: COLORS.text,
    minHeight: 50,
  },
  charCount: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SIZES.marginSmall,
  },
  exampleButton: {
    marginTop: SIZES.marginSmall,
  },
  exampleText: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  generateButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  currentBarcodeContainer: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  barcodeInfo: {
    marginBottom: SIZES.margin,
  },
  barcodeType: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  barcodeData: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginTop: SIZES.marginSmall,
  },
  barcodeTime: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: SIZES.marginSmall,
  },
  barcodeImageContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: SIZES.margin,
  },
  barcodeImageText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  barcodeFilename: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: SIZES.marginSmall,
    fontFamily: 'monospace',
  },
  viewBarcodeButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.marginSmall,
    borderRadius: SIZES.radiusSmall,
    marginTop: SIZES.marginSmall,
    alignItems: 'center',
  },
  viewBarcodeButtonText: {
    color: COLORS.textLight,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    margin: SIZES.margin,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  imageModalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeImageButton: {
    padding: SIZES.marginSmall,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  barcodeImage: {
    width: 300,
    height: 300,
    borderRadius: SIZES.radiusSmall,
  },
  closeImageModalButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  closeImageModalButtonText: {
    color: COLORS.textLight,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  generateButtonText: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginLeft: SIZES.marginSmall,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.marginSmall,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  recentItem: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.marginSmall,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentDetails: {
    marginLeft: SIZES.marginSmall,
    flex: 1,
  },
  recentType: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recentData: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recentTime: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: SIZES.marginSmall,
    marginLeft: SIZES.marginSmall,
  },
  deleteButton: {
    backgroundColor: COLORS.error + '20',
    borderRadius: SIZES.radiusSmall,
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
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.padding,
  },
  typeOption: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeOptionSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  typeOptionContent: {
    flex: 1,
  },
  typeOptionName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  typeOptionDescription: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  typeOptionExample: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.marginLarge * 2,
  },
  emptyText: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.margin,
  },
  emptySubtext: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SIZES.marginSmall,
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyDetails: {
    marginLeft: SIZES.marginSmall,
    flex: 1,
  },
  historyType: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  historyData: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyTime: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyProduct: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  historyPrice: {
    fontSize: SIZES.caption,
    color: COLORS.success,
    marginTop: 2,
    fontWeight: '500',
  },
  historyActions: {
    flexDirection: 'row',
  },
  connectionStatusSection: {
    marginBottom: SIZES.marginLarge,
  },
  connectionStatusCard: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  connectionStatusContent: {
    flex: 1,
    marginLeft: SIZES.margin,
  },
  connectionStatusTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SIZES.marginSmall,
  },
  connectionStatusText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.margin,
    lineHeight: 20,
  },
  retryConnectionButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignSelf: 'flex-start',
  },
  retryConnectionButtonDisabled: {
    opacity: 0.6,
  },
  retryConnectionButtonText: {
    color: COLORS.textLight,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: SIZES.marginSmall,
  },
});

export default BarcodeGeneratorScreen;
