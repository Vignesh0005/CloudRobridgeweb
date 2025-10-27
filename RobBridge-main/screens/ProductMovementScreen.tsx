import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  SafeAreaView,
  ScrollView,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SIZES } from '../constants';
import { API_URLS } from '../config/server';
import { DEVELOPMENT_CONFIG } from '../config/development';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface ProductMovement {
  id: number;
  movement_type: 'inbound' | 'outbound';
  product_name: string;
  product_id: string;
  rack_id?: string;
  quantity: number;
  notes?: string;
  timestamp: string;
}

const ProductMovementScreen: React.FC = () => {
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { authToken, logout } = useAuth();
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [newMovement, setNewMovement] = useState({
    type: 'outbound' as 'inbound' | 'outbound',
    productName: '',
    productId: '',
    rackId: '',
    quantity: '1',
    notes: '',
  });

  // Fetch movements from API
  const fetchMovements = useCallback(async () => {
    // Development mode - use mock data
    if (DEVELOPMENT_CONFIG.IS_DEVELOPMENT_MODE && DEVELOPMENT_CONFIG.USE_MOCK_DATA) {
      console.log('Development mode: Using mock movement data');
      const mockMovements: ProductMovement[] = [
        {
          id: 1,
          movement_type: 'inbound',
          product_name: 'Electronics Kit',
          product_id: 'ELEK001',
          rack_id: 'R001',
          quantity: 50,
          notes: 'Initial stock received',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          id: 2,
          movement_type: 'outbound',
          product_name: 'Mechanical Parts',
          product_id: 'MECH002',
          rack_id: 'R003',
          quantity: 25,
          notes: 'Order fulfillment',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        },
        {
          id: 3,
          movement_type: 'inbound',
          product_name: 'Widget Components',
          product_id: 'WIDG003',
          rack_id: 'R005',
          quantity: 100,
          notes: 'Weekly restock',
          timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
        },
        {
          id: 4,
          movement_type: 'outbound',
          product_name: 'Electronics Kit',
          product_id: 'ELEK001',
          rack_id: 'R001',
          quantity: 15,
          notes: 'Emergency order',
          timestamp: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
        },
        {
          id: 5,
          movement_type: 'inbound',
          product_name: 'Assembly Tools',
          product_id: 'TOOL004',
          rack_id: 'R002',
          quantity: 30,
          notes: 'New equipment delivery',
          timestamp: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
        },
      ];
      setMovements(mockMovements);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!authToken) {
      console.log('No auth token available');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching product movements from:', API_URLS.GET_PRODUCT_MOVEMENTS);
      const response = await fetch(API_URLS.GET_PRODUCT_MOVEMENTS, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Movements response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Movements response data:', data);
        setMovements(data.data || []);
      } else {
        const errorData = await response.text();
        console.log('Movements fetch failed:', errorData);
        Alert.alert('Error', 'Failed to fetch product movements');
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
      Alert.alert('Error', 'Network error while fetching movements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMovements();
  }, [fetchMovements]);

  const handleAddMovement = async () => {
    if (!newMovement.productName.trim() || !newMovement.productId.trim()) {
      Alert.alert('Error', 'Product name and ID are required');
      return;
    }

    if (!authToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_URLS.RECORD_PRODUCT_MOVEMENT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newMovement.type,
          productName: newMovement.productName,
          productId: newMovement.productId,
          rackId: newMovement.rackId || null,
          quantity: parseInt(newMovement.quantity) || 1,
          notes: newMovement.notes || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Movement recorded:', data);
        Alert.alert('Success', 'Product movement recorded successfully');
        setShowAddModal(false);
        setNewMovement({
          type: 'outbound',
          productName: '',
          productId: '',
          rackId: '',
          quantity: '1',
          notes: '',
        });
        fetchMovements();
      } else {
        const errorData = await response.text();
        console.log('Failed to record movement:', errorData);
        Alert.alert('Error', 'Failed to record product movement');
      }
    } catch (error) {
      console.error('Error recording movement:', error);
      Alert.alert('Error', 'Network error while recording movement');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filename: string, fileType: string) => {
    try {
      const downloadUrl = API_URLS.DOWNLOAD_REPORT(filename);
      console.log('Downloading file from:', downloadUrl);
      
      // Create a local file path
      const localUri = FileSystem.documentDirectory + filename;
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, localUri, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (downloadResult.status === 200) {
        console.log('File downloaded to:', downloadResult.uri);
        
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // Share the file
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: fileType === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: `Share ${fileType} Report`,
          });
        } else {
          // Fallback to opening in browser
          await Linking.openURL(downloadUrl);
          Alert.alert(
            'Download Started',
            `The ${fileType} report is being downloaded. Check your browser's download folder.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // Fallback to browser download
      try {
        const downloadUrl = API_URLS.DOWNLOAD_REPORT(filename);
        await Linking.openURL(downloadUrl);
        Alert.alert(
          'Download Started',
          `The ${fileType} report is being downloaded. Check your browser's download folder.`,
          [{ text: 'OK' }]
        );
      } catch (fallbackError) {
        Alert.alert(
          'Download Link',
          `Copy this link to download the ${fileType} report:\n\n${API_URLS.DOWNLOAD_REPORT(filename)}`,
          [
            { text: 'Cancel' },
            { 
              text: 'Copy Link', 
              onPress: () => {
                Alert.alert('Link Copied', 'The download link has been copied to your clipboard');
              }
            }
          ]
        );
      }
    }
  };

  const generateExcelReport = async () => {
    if (!authToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setGeneratingReport(true);
      const response = await fetch(`${API_URLS.GENERATE_EXCEL_REPORT}?days=30`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Excel report generated:', data);
        Alert.alert(
          'Success', 
          `Excel report generated successfully!\n\nFilename: ${data.filename}\nRecords: ${data.record_count}`,
          [
            { text: 'OK' },
            { 
              text: 'Download', 
              onPress: () => downloadFile(data.filename, 'Excel')
            }
          ]
        );
      } else {
        const errorData = await response.text();
        console.log('Failed to generate Excel report:', errorData);
        Alert.alert('Error', 'Failed to generate Excel report');
      }
    } catch (error) {
      console.error('Error generating Excel report:', error);
      Alert.alert('Error', 'Network error while generating Excel report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const generatePDFReport = async () => {
    if (!authToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      setGeneratingReport(true);
      const response = await fetch(`${API_URLS.GENERATE_PDF_REPORT}?days=30`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('PDF report generated:', data);
        Alert.alert(
          'Success', 
          `PDF report generated successfully!\n\nFilename: ${data.filename}\nRecords: ${data.record_count}`,
          [
            { text: 'OK' },
            { 
              text: 'Download', 
              onPress: () => downloadFile(data.filename, 'PDF')
            }
          ]
        );
      } else {
        const errorData = await response.text();
        console.log('Failed to generate PDF report:', errorData);
        Alert.alert('Error', 'Failed to generate PDF report');
      }
    } catch (error) {
      console.error('Error generating PDF report:', error);
      Alert.alert('Error', 'Network error while generating PDF report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Navigation functions
  const toggleDrawer = () => {
    console.log('ProductMovementScreen: Menu button pressed - attempting to toggle drawer');
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('ProductMovementScreen: Drawer toggled successfully');
      } else {
        console.error('ProductMovementScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('ProductMovementScreen: Error toggling drawer:', error);
    }
  };

  const handleLogout = () => {
    console.log('ProductMovementScreen: Logout button pressed');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderMovementItem = ({ item }: { item: ProductMovement }) => (
    <View style={styles.movementItem}>
      <View style={styles.movementInfo}>
        <View style={styles.movementHeader}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <View style={[
            styles.typeBadge,
            { backgroundColor: item.movement_type === 'outbound' ? COLORS.primary : COLORS.success }
          ]}>
            <Text style={styles.typeText}>
              {item.movement_type === 'outbound' ? 'OUT' : 'IN'}
            </Text>
          </View>
        </View>
        
        <View style={styles.movementDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="barcode" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>ID: {item.product_id}</Text>
          </View>
          
          {item.rack_id && (
            <View style={styles.detailRow}>
              <Ionicons name="cube" size={16} color={COLORS.gray} />
              <Text style={styles.detailText}>Rack: {item.rack_id}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Ionicons name="layers" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>Qty: {item.quantity}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
          
          {item.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={16} color={COLORS.gray} />
              <Text style={styles.detailText}>{item.notes}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color={COLORS.gray} />
      <Text style={styles.emptyText}>No product movements found</Text>
      <Text style={styles.emptySubtext}>Start by recording a product movement</Text>
      <TouchableOpacity
        style={styles.emptyAddButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.emptyAddButtonText}>Record Movement</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading movements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleDrawer}
          activeOpacity={0.5}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Product Movements</Text>
          <Text style={styles.headerSubtitle}>Track inbound and outbound products</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.success }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.5}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reportSection}>
        <Text style={styles.reportTitle}>Generate Reports</Text>
        <View style={styles.reportButtons}>
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: COLORS.success }]}
            onPress={generateExcelReport}
            disabled={generatingReport}
          >
            <Ionicons name="document-text" size={20} color={COLORS.text} />
            <Text style={styles.reportButtonText}>
              {generatingReport ? 'Generating...' : 'Excel Report'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.reportButton, { backgroundColor: COLORS.primary }]}
            onPress={generatePDFReport}
            disabled={generatingReport}
          >
            <Ionicons name="document" size={20} color={COLORS.text} />
            <Text style={styles.reportButtonText}>
              {generatingReport ? 'Generating...' : 'PDF Report'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: COLORS.gray, marginTop: SIZES.margin }]}
          onPress={() => {
            const baseUrl = 'https://web-production-903c6.up.railway.app';
            Alert.alert(
              'Download Reports',
              `You can also download reports directly from:\n\n${baseUrl}/exports/\n\nOr use the generated download links from the report generation.`,
              [
                { text: 'OK' },
                { 
                  text: 'Open Folder', 
                  onPress: () => Linking.openURL(`${baseUrl}/exports/`)
                }
              ]
            );
          }}
        >
          <Ionicons name="folder-open" size={20} color={COLORS.text} />
          <Text style={styles.reportButtonText}>View Reports Folder</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={movements}
        renderItem={renderMovementItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
      />

      {/* Add Movement Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Product Movement</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Movement Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newMovement.type === 'outbound' && styles.typeOptionSelected
                  ]}
                  onPress={() => setNewMovement({ ...newMovement, type: 'outbound' })}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newMovement.type === 'outbound' && styles.typeOptionTextSelected
                  ]}>
                    Outbound
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    newMovement.type === 'inbound' && styles.typeOptionSelected
                  ]}
                  onPress={() => setNewMovement({ ...newMovement, type: 'inbound' })}
                >
                  <Text style={[
                    styles.typeOptionText,
                    newMovement.type === 'inbound' && styles.typeOptionTextSelected
                  ]}>
                    Inbound
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newMovement.productName}
                onChangeText={(text) => setNewMovement({ ...newMovement, productName: text })}
                placeholder="Enter product name"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product ID *</Text>
              <TextInput
                style={styles.textInput}
                value={newMovement.productId}
                onChangeText={(text) => setNewMovement({ ...newMovement, productId: text })}
                placeholder="Enter product ID"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rack ID</Text>
              <TextInput
                style={styles.textInput}
                value={newMovement.rackId}
                onChangeText={(text) => setNewMovement({ ...newMovement, rackId: text })}
                placeholder="Enter rack ID (optional)"
                placeholderTextColor={COLORS.gray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.textInput}
                value={newMovement.quantity}
                onChangeText={(text) => setNewMovement({ ...newMovement, quantity: text })}
                placeholder="Enter quantity"
                placeholderTextColor={COLORS.gray}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newMovement.notes}
                onChangeText={(text) => setNewMovement({ ...newMovement, notes: text })}
                placeholder="Enter notes (optional)"
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddMovement}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.saveButtonText}>Record Movement</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.margin,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.margin,
  },
  logoutButton: {
    padding: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reportSection: {
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  reportButtons: {
    flexDirection: 'row',
    gap: SIZES.margin,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    borderRadius: 12,
    gap: 8,
  },
  reportButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: SIZES.padding,
    paddingBottom: 32,
    flexGrow: 1,
  },
  movementItem: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  movementInfo: {
    flex: 1,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  movementDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.paddingLarge * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: SIZES.margin,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
    marginBottom: SIZES.marginLarge,
  },
  emptyAddButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.padding,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.padding,
  },
  inputGroup: {
    marginBottom: SIZES.marginLarge,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SIZES.margin,
  },
  typeOption: {
    flex: 1,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  typeOptionTextSelected: {
    color: COLORS.text,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SIZES.marginLarge,
  },
  saveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductMovementScreen;
