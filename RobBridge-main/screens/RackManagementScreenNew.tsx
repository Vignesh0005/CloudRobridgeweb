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
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SIZES } from '../constants';
import { API_URLS } from '../config/server';
import { DEVELOPMENT_CONFIG } from '../config/development';

interface Rack {
  id: string;
  name: string;
  status: 'occupied' | 'empty';
  productName?: string;
  productId?: string;
  lastUpdated?: string;
}

const RackManagementScreenNew: React.FC = () => {
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { authToken, logout } = useAuth();
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
  const [newRack, setNewRack] = useState({ name: '', productName: '', productId: '' });
  const [editForm, setEditForm] = useState({ productName: '', productId: '' });

  // Fetch racks from API
  const fetchRacks = useCallback(async () => {
    // Development mode - use mock data
    if (DEVELOPMENT_CONFIG.IS_DEVELOPMENT_MODE && DEVELOPMENT_CONFIG.USE_MOCK_DATA) {
      console.log('Development mode: Using mock rack data');
      const mockRacks: Rack[] = [
        {
          id: 'R001',
          name: 'Rack A1',
          status: 'occupied',
          productName: 'Electronics Kit',
          productId: 'ELEK001',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'R002',
          name: 'Rack A2',
          status: 'empty',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'R003',
          name: 'Rack A3',
          status: 'occupied',
          productName: 'Mechanical Parts',
          productId: 'MECH002',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'R004',
          name: 'Rack B1',
          status: 'empty',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'R005',
          name: 'Rack B2',
          status: 'occupied',
          productName: 'Widget Components',
          productId: 'WIDG003',
          lastUpdated: new Date().toISOString(),
        },
      ];
      setRacks(mockRacks);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!authToken) {
      console.log('No auth token available');
      setLoading(false);
      return;
    }

    console.log('Fetching racks from:', API_URLS.GET_RACKS);
    console.log('Auth token:', authToken ? 'Present' : 'Missing');

    try {
      const response = await fetch(API_URLS.GET_RACKS, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Racks data:', data);
        setRacks(data.data || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch racks:', response.status, errorText);
        Alert.alert('Error', `Failed to fetch racks: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching racks:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchRacks();
  }, [fetchRacks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRacks();
  }, [fetchRacks]);

  // Add new rack
  const handleAddRack = async () => {
    if (!newRack.name.trim()) {
      Alert.alert('Error', 'Rack name is required');
      return;
    }

    if (!authToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      const response = await fetch(API_URLS.CREATE_RACK, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRack.name.trim(),
          productName: newRack.productName.trim() || null,
          productId: newRack.productId.trim() || null,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Rack added successfully');
        setNewRack({ name: '', productName: '', productId: '' });
        setShowAddModal(false);
        fetchRacks();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to add rack');
      }
    } catch (error) {
      console.error('Error adding rack:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  // Update rack status
  const handleUpdateStatus = async (rackId: string, status: 'occupied' | 'empty') => {
    if (!authToken) return;

    try {
      const response = await fetch(`${API_URLS.GET_RACKS}/${rackId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        Alert.alert('Success', `Rack marked as ${status}`);
        fetchRacks();
      } else {
        Alert.alert('Error', 'Failed to update rack status');
      }
    } catch (error) {
      console.error('Error updating rack status:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  // Update rack details
  const handleUpdateRack = async () => {
    if (!selectedRack || !authToken) return;

    try {
      const response = await fetch(API_URLS.UPDATE_RACK(selectedRack.id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: editForm.productName.trim() || null,
          productId: editForm.productId.trim() || null,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Rack updated successfully');
        setShowEditModal(false);
        setSelectedRack(null);
        fetchRacks();
      } else {
        Alert.alert('Error', 'Failed to update rack');
      }
    } catch (error) {
      console.error('Error updating rack:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  // Open edit modal
  const openEditModal = (rack: Rack) => {
    setSelectedRack(rack);
    setEditForm({
      productName: rack.productName || '',
      productId: rack.productId || '',
    });
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedRack(null);
    setEditForm({ productName: '', productId: '' });
  };

  // Close add modal
  const closeAddModal = () => {
    setShowAddModal(false);
    setNewRack({ name: '', productName: '', productId: '' });
  };

  // Navigation functions
  const toggleDrawer = () => {
    console.log('RackManagementScreen: Menu button pressed - attempting to toggle drawer');
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('RackManagementScreen: Drawer toggled successfully');
      } else {
        console.error('RackManagementScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('RackManagementScreen: Error toggling drawer:', error);
    }
  };

  const handleLogout = () => {
    console.log('RackManagementScreen: Logout button pressed');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderRackItem = ({ item }: { item: Rack }) => (
    <View style={styles.rackItem}>
      <View style={styles.rackInfo}>
        <View style={styles.rackHeader}>
          <Text style={styles.rackName}>{item.name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'occupied' ? COLORS.primary : COLORS.gray }
          ]}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: item.status === 'occupied' ? COLORS.text : COLORS.background }
            ]} />
            <Text style={[
              styles.statusText,
              { color: item.status === 'occupied' ? COLORS.text : COLORS.background }
            ]}>
              {item.status === 'occupied' ? 'Occupied' : 'Empty'}
            </Text>
          </View>
        </View>
        
        {item.productName && (
          <View style={styles.productInfoContainer}>
            <Ionicons name="cube" size={16} color={COLORS.gray} />
            <Text style={styles.productInfo}>Product: {item.productName}</Text>
          </View>
        )}
        {item.productId && (
          <View style={styles.productInfoContainer}>
            <Ionicons name="barcode" size={16} color={COLORS.gray} />
            <Text style={styles.productInfo}>ID: {item.productId}</Text>
          </View>
        )}
        {item.lastUpdated && (
          <View style={styles.productInfoContainer}>
            <Ionicons name="time" size={16} color={COLORS.gray} />
            <Text style={styles.lastUpdatedText}>Updated: {new Date(item.lastUpdated).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.rackActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: item.status === 'occupied' ? COLORS.gray : COLORS.primary }
          ]}
          onPress={() => handleUpdateStatus(item.id, item.status === 'occupied' ? 'empty' : 'occupied')}
        >
          <Ionicons 
            name={item.status === 'occupied' ? 'remove-circle' : 'add-circle'} 
            size={22} 
            color={COLORS.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading racks...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
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
          <Text style={styles.headerTitle}>Rack Management</Text>
          <Text style={styles.headerSubtitle}>{racks.length} racks total</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color={COLORS.text} />
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

      {/* Racks List */}
      <FlatList
        data={racks}
        renderItem={renderRackItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="cube-outline" size={80} color={COLORS.gray} />
            </View>
            <Text style={styles.emptyText}>No racks found</Text>
            <Text style={styles.emptySubtext}>Add your first rack to get started</Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.text} />
              <Text style={styles.emptyAddButtonText}>Add First Rack</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Rack Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Rack</Text>
              <TouchableOpacity onPress={closeAddModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rack Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newRack.name}
                  onChangeText={(text) => setNewRack(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Rack A1"
                  placeholderTextColor={COLORS.gray}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newRack.productName}
                  onChangeText={(text) => setNewRack(prev => ({ ...prev, productName: text }))}
                  placeholder="Product name (optional)"
                  placeholderTextColor={COLORS.gray}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={newRack.productId}
                  onChangeText={(text) => setNewRack(prev => ({ ...prev, productId: text }))}
                  placeholder="Product ID (optional)"
                  placeholderTextColor={COLORS.gray}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={closeAddModal}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.addButton]}
                  onPress={handleAddRack}
                >
                  <Text style={styles.buttonText}>Add Rack</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Rack Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Rack: {selectedRack?.name}</Text>
              <TouchableOpacity onPress={closeEditModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.productName}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, productName: text }))}
                  placeholder="Product name"
                  placeholderTextColor={COLORS.gray}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.productId}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, productId: text }))}
                  placeholder="Product ID"
                  placeholderTextColor={COLORS.gray}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={closeEditModal}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.addButton]}
                  onPress={handleUpdateRack}
                >
                  <Text style={styles.buttonText}>Update Rack</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  rackItem: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rackInfo: {
    flex: 1,
    marginRight: 16,
  },
  rackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rackName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  productInfo: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  rackActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyAddButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.gray,
  },
  addButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default RackManagementScreenNew;