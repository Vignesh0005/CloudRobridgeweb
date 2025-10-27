import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

interface ScannedBarcode {
  id: string;
  barcodeData: string;
  barcodeType: string;
  timestamp: string;
  deviceId: string;
  aiAnalysis?: {
    title?: string;
    category?: string;
    description?: string;
    description_short?: string;
    country?: string;
    success?: boolean;
  };
  isValidated?: boolean;
}

interface ScannedBarcodesScreenProps {
  navigation: any;
}

const ScannedBarcodesScreen: React.FC<ScannedBarcodesScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { latestScan } = useWebSocket();
  const [scannedBarcodes, setScannedBarcodes] = useState<ScannedBarcode[]>([]);
  const [filteredBarcodes, setFilteredBarcodes] = useState<ScannedBarcode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const barcodeTypes = ['All Types', 'QR Code', 'Code128', 'EAN', 'UPC'];

  useEffect(() => {
    loadScannedBarcodes();
  }, []);

  useEffect(() => {
    // Add new scans to the list when they come from WebSocket
    if (latestScan && latestScan.barcodeData) {
      const newBarcode: ScannedBarcode = {
        id: Date.now().toString(),
        barcodeData: latestScan.barcodeData,
        barcodeType: latestScan.barcodeType || 'Unknown',
        timestamp: new Date().toISOString(),
        deviceId: latestScan.deviceId || 'Unknown',
        aiAnalysis: latestScan.aiAnalysis,
        isValidated: false,
      };
      
      setScannedBarcodes(prev => [newBarcode, ...prev]);
    }
  }, [latestScan]);

  useEffect(() => {
    filterBarcodes();
  }, [scannedBarcodes, searchQuery, selectedType]);

  const loadScannedBarcodes = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from your backend API
      // For now, we'll use mock data or localStorage
      const savedBarcodes = await getSavedBarcodes();
      setScannedBarcodes(savedBarcodes);
    } catch (error) {
      console.error('Error loading scanned barcodes:', error);
      Alert.alert('Error', 'Failed to load scanned barcodes');
    } finally {
      setLoading(false);
    }
  };

  const getSavedBarcodes = async (): Promise<ScannedBarcode[]> => {
    // Mock implementation - replace with actual API call
    return [
      {
        id: '1',
        barcodeData: '1234567890123',
        barcodeType: 'EAN',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        deviceId: 'ESP32-001',
        aiAnalysis: {
          title: 'Sample Product',
          category: 'Electronics',
          description: 'A sample electronic product',
          success: true,
        },
        isValidated: true,
      },
    ];
  };

  const filterBarcodes = () => {
    let filtered = scannedBarcodes;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(barcode =>
        barcode.barcodeData.toLowerCase().includes(searchQuery.toLowerCase()) ||
        barcode.aiAnalysis?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        barcode.aiAnalysis?.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'All Types') {
      filtered = filtered.filter(barcode => barcode.barcodeType === selectedType);
    }

    setFilteredBarcodes(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScannedBarcodes();
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    if (filteredBarcodes.length === 0) {
      Alert.alert('No Data', 'No scanned barcodes to export');
      return;
    }

    // Create CSV content
    const csvHeader = 'ID,Barcode Data,Type,Timestamp,Device ID,Product Title,Category,Validated\n';
    const csvRows = filteredBarcodes.map(barcode => 
      `${barcode.id},"${barcode.barcodeData}",${barcode.barcodeType},${barcode.timestamp},${barcode.deviceId},"${barcode.aiAnalysis?.title || ''}",${barcode.aiAnalysis?.category || ''},${barcode.isValidated ? 'Yes' : 'No'}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    // In a real app, you would save this to a file
    Alert.alert('Export CSV', `CSV data ready:\n\n${csvContent.substring(0, 200)}...`);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Barcodes',
      'Are you sure you want to clear all scanned barcodes? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setScannedBarcodes([]);
            setFilteredBarcodes([]);
          },
        },
      ]
    );
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

  const toggleDrawer = () => {
    navigation.openDrawer();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderBarcodeItem = ({ item }: { item: ScannedBarcode }) => (
    <View style={styles.barcodeCard}>
      <View style={styles.barcodeHeader}>
        <View style={styles.barcodeTypeContainer}>
          <Ionicons 
            name={item.barcodeType === 'QR Code' ? 'qr-code' : 'barcode'} 
            size={20} 
            color={COLORS.primary} 
          />
          <Text style={styles.barcodeType}>{item.barcodeType}</Text>
        </View>
        <View style={styles.validationContainer}>
          {item.isValidated ? (
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          ) : (
            <Ionicons name="time" size={20} color={COLORS.warning} />
          )}
        </View>
      </View>
      
      <Text style={styles.barcodeData} numberOfLines={1}>
        {item.barcodeData}
      </Text>
      
      {item.aiAnalysis?.title && (
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.aiAnalysis.title}
        </Text>
      )}
      
      {item.aiAnalysis?.category && (
        <Text style={styles.productCategory} numberOfLines={1}>
          Category: {item.aiAnalysis.category}
        </Text>
      )}
      
      <View style={styles.barcodeFooter}>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        <Text style={styles.deviceId}>Device: {item.deviceId}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={80} color={COLORS.gray} />
      <Text style={styles.emptyTitle}>No Scanned Barcodes Found</Text>
      <Text style={styles.emptyText}>
        No barcodes have been scanned yet. Start scanning with your ESP32 device to see barcode history here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
          <Ionicons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scanned Barcodes</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Page Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            View and manage all your scanned barcodes from ESP32 devices.
          </Text>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search scanned barcodes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color={COLORS.white} />
            <Text style={styles.filterButtonText}>{selectedType}</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportCSV}>
            <Ionicons name="download" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Export CSV</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Ionicons name="trash" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Scanned Barcodes History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Scanned Barcodes History</Text>
            <Text style={styles.historyCount}>
              {filteredBarcodes.length} of {scannedBarcodes.length} scanned barcodes
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading scanned barcodes...</Text>
            </View>
          ) : filteredBarcodes.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredBarcodes}
              renderItem={renderBarcodeItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
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
  refreshButton: {
    padding: SIZES.paddingSmall,
    marginRight: SIZES.paddingSmall,
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
    color: COLORS.text,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
    gap: SIZES.paddingSmall,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SIZES.paddingSmall,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.padding,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  filterButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
    gap: SIZES.paddingSmall,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  historySection: {
    marginBottom: SIZES.padding,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  historyTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyCount: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  loadingContainer: {
    padding: SIZES.padding * 2,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.padding * 3,
  },
  emptyTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SIZES.padding,
  },
  barcodeCard: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barcodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  barcodeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  barcodeType: {
    fontSize: SIZES.caption,
    fontWeight: '500',
    color: COLORS.primary,
  },
  validationContainer: {
    // Validation icon container
  },
  barcodeData: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  productTitle: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  productCategory: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginBottom: SIZES.paddingSmall,
  },
  barcodeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  deviceId: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
});

export default ScannedBarcodesScreen;
