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

interface ProductMovement {
  id: string;
  productName: string;
  productId: string;
  rackLocation: string;
  quantity: number;
  movementType: 'inbound' | 'outbound';
  timestamp: string;
  status: 'pending' | 'completed';
  notes?: string;
}

interface ProductManagementScreenProps {
  navigation: any;
}

const ProductManagementScreen: React.FC<ProductManagementScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<ProductMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const movementTypes = ['All Types', 'Inbound', 'Outbound'];

  useEffect(() => {
    loadMovements();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, searchQuery, selectedType]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockMovements: ProductMovement[] = [
        {
          id: 'M001',
          productName: 'Widget A',
          productId: 'WID-001',
          rackLocation: 'Rack A-01',
          quantity: 50,
          movementType: 'inbound',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed',
          notes: 'Initial stock',
        },
        {
          id: 'M002',
          productName: 'Gadget B',
          productId: 'GAD-002',
          rackLocation: 'Rack B-02',
          quantity: 25,
          movementType: 'outbound',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'completed',
          notes: 'Order fulfillment',
        },
        {
          id: 'M003',
          productName: 'Component C',
          productId: 'COM-003',
          rackLocation: 'Rack C-03',
          quantity: 100,
          movementType: 'inbound',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          status: 'pending',
          notes: 'Restock order',
        },
      ];
      setMovements(mockMovements);
    } catch (error) {
      console.error('Error loading movements:', error);
      Alert.alert('Error', 'Failed to load product movements');
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = movements;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(movement =>
        movement.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movement.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movement.rackLocation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'All Types') {
      filtered = filtered.filter(movement => 
        movement.movementType === selectedType.toLowerCase()
      );
    }

    setFilteredMovements(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMovements();
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      Alert.alert('No Data', 'No movements to export');
      return;
    }

    // Create CSV content
    const csvHeader = 'ID,Product Name,Product ID,Rack Location,Quantity,Type,Status,Timestamp,Notes\n';
    const csvRows = filteredMovements.map(movement => 
      `${movement.id},"${movement.productName}","${movement.productId}","${movement.rackLocation}",${movement.quantity},${movement.movementType},${movement.status},"${movement.timestamp}","${movement.notes || ''}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    Alert.alert('Export CSV', `CSV data ready:\n\n${csvContent.substring(0, 200)}...`);
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

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'inbound': return COLORS.success;
      case 'outbound': return COLORS.error;
      default: return COLORS.gray;
    }
  };

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'inbound': return 'arrow-down';
      case 'outbound': return 'arrow-up';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'pending': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  // Separate movements by type
  const inboundMovements = filteredMovements.filter(m => m.movementType === 'inbound');
  const outboundMovements = filteredMovements.filter(m => m.movementType === 'outbound');

  const renderMovementItem = ({ item }: { item: ProductMovement }) => (
    <View style={styles.movementCard}>
      <View style={styles.movementHeader}>
        <View style={styles.productInfo}>
          <View style={styles.productRow}>
            <Ionicons name="cube" size={20} color={COLORS.primary} />
            <Text style={styles.productName}>{item.productName}</Text>
          </View>
          <View style={styles.productRow}>
            <Ionicons name="barcode" size={20} color={COLORS.gray} />
            <Text style={styles.productId}>{item.productId}</Text>
          </View>
        </View>
        
        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <Ionicons name="business" size={20} color={COLORS.primary} />
            <Text style={styles.rackLocation}>{item.rackLocation}</Text>
          </View>
          <View style={styles.quantityRow}>
            <Ionicons name="list" size={20} color={COLORS.gray} />
            <Text style={styles.quantity}>{item.quantity} units</Text>
          </View>
        </View>
      </View>
      
      {item.notes && (
        <View style={styles.notesContainer}>
          <TextInput
            style={styles.notesInput}
            value={item.notes}
            editable={false}
            placeholder="Notes"
            placeholderTextColor={COLORS.gray}
          />
        </View>
      )}
      
      <View style={styles.movementFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={80} color={COLORS.gray} />
      <Text style={styles.emptyTitle}>No Product Movements Found</Text>
      <Text style={styles.emptyText}>
        No product movements match your current search or filter criteria.
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
          <Text style={styles.headerTitle}>Product Management</Text>
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
            Manage product movements, inventory, and warehouse operations.
          </Text>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, IDs, or locations"
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
          <TouchableOpacity style={styles.refreshActionButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
            <Ionicons name="download" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Inbound Movements */}
        {inboundMovements.length > 0 && (
          <View style={styles.movementSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="arrow-down" size={24} color={COLORS.success} />
                <Text style={styles.sectionTitle}>Inbound</Text>
              </View>
              <Text style={styles.timestamp}>
                {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
              </Text>
            </View>
            
            <FlatList
              data={inboundMovements}
              renderItem={renderMovementItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Outbound Movements */}
        {outboundMovements.length > 0 && (
          <View style={styles.movementSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="arrow-up" size={24} color={COLORS.error} />
                <Text style={styles.sectionTitle}>Outbound</Text>
              </View>
              <Text style={styles.timestamp}>
                {new Date(Date.now() - 86400000).toLocaleDateString()}, {new Date(Date.now() - 86400000).toLocaleTimeString()}
              </Text>
            </View>
            
            <FlatList
              data={outboundMovements}
              renderItem={renderMovementItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Empty State */}
        {filteredMovements.length === 0 && !loading && (
          renderEmptyState()
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading product movements...</Text>
          </View>
        )}
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
    color: COLORS.white,
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
    borderColor: COLORS.gray,
  },
  searchIcon: {
    marginRight: SIZES.paddingSmall,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.padding,
    fontSize: SIZES.body,
    color: COLORS.white,
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
  refreshActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  movementSection: {
    marginBottom: SIZES.padding * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.white,
  },
  timestamp: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  movementCard: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.paddingSmall,
  },
  productInfo: {
    flex: 1,
    gap: SIZES.paddingSmall / 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  productName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
  productId: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  locationInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: SIZES.paddingSmall / 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  rackLocation: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.white,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  quantity: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  notesContainer: {
    marginBottom: SIZES.paddingSmall,
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    fontSize: SIZES.body,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  movementFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
  },
  statusText: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    color: COLORS.white,
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
    color: COLORS.white,
    marginTop: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: SIZES.padding,
  },
});

export default ProductManagementScreen;
