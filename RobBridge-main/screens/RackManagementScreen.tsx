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

interface Rack {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  capacity: number;
  currentLoad: number;
  products: string[];
  lastUpdated: string;
}

interface RackManagementScreenProps {
  navigation: any;
}

const RackManagementScreen: React.FC<RackManagementScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [racks, setRacks] = useState<Rack[]>([]);
  const [filteredRacks, setFilteredRacks] = useState<Rack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  const statusOptions = ['All Status', 'Active', 'Inactive'];

  useEffect(() => {
    loadRacks();
  }, []);

  useEffect(() => {
    filterRacks();
  }, [racks, searchQuery, selectedStatus]);

  const loadRacks = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockRacks: Rack[] = [
        {
          id: 'R001',
          name: 'Rack A-01',
          location: 'Warehouse A',
          status: 'active',
          capacity: 100,
          currentLoad: 75,
          products: ['Widget A', 'Component B'],
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'R002',
          name: 'Rack A-02',
          location: 'Warehouse A',
          status: 'active',
          capacity: 100,
          currentLoad: 0,
          products: [],
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'R003',
          name: 'Rack B-01',
          location: 'Warehouse B',
          status: 'inactive',
          capacity: 100,
          currentLoad: 0,
          products: [],
          lastUpdated: new Date().toISOString(),
        },
      ];
      setRacks(mockRacks);
    } catch (error) {
      console.error('Error loading racks:', error);
      Alert.alert('Error', 'Failed to load rack data');
    } finally {
      setLoading(false);
    }
  };

  const filterRacks = () => {
    let filtered = racks;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(rack =>
        rack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rack.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rack.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rack.products.some(product => 
          product.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by status
    if (selectedStatus !== 'All Status') {
      filtered = filtered.filter(rack => rack.status === selectedStatus.toLowerCase());
    }

    setFilteredRacks(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRacks();
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    if (filteredRacks.length === 0) {
      Alert.alert('No Data', 'No racks to export');
      return;
    }

    // Create CSV content
    const csvHeader = 'ID,Name,Location,Status,Capacity,Current Load,Products,Last Updated\n';
    const csvRows = filteredRacks.map(rack => 
      `${rack.id},"${rack.name}","${rack.location}",${rack.status},${rack.capacity},${rack.currentLoad},"${rack.products.join('; ')}","${rack.lastUpdated}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    Alert.alert('Export CSV', `CSV data ready:\n\n${csvContent.substring(0, 200)}...`);
  };

  const handleInitializeDatabase = () => {
    Alert.alert(
      'Initialize Database',
      'This will set up the database tables. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Initialize', onPress: () => {
          Alert.alert('Success', 'Database initialized successfully!');
        }},
      ]
    );
  };

  const handleAddNewRack = () => {
    Alert.alert('Add New Rack', 'Add new rack functionality will be implemented here.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'inactive': return COLORS.error;
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'inactive': return 'close-circle';
      default: return 'help-circle';
    }
  };

  // Calculate summary statistics
  const totalRacks = racks.length;
  const activeRacks = racks.filter(rack => rack.status === 'active').length;
  const inactiveRacks = racks.filter(rack => rack.status === 'inactive').length;
  const totalProducts = racks.reduce((sum, rack) => sum + rack.products.length, 0);

  const renderRackItem = ({ item }: { item: Rack }) => (
    <View style={styles.rackCard}>
      <View style={styles.rackHeader}>
        <View style={styles.rackInfo}>
          <Text style={styles.rackName}>{item.name}</Text>
          <Text style={styles.rackId}>ID: {item.id}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.status) as any} 
            size={20} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.rackDetails}>
        <Text style={styles.detailText}>Location: {item.location}</Text>
        <Text style={styles.detailText}>Capacity: {item.capacity} units</Text>
        <Text style={styles.detailText}>Current Load: {item.currentLoad} units</Text>
        <Text style={styles.detailText}>Products: {item.products.length}</Text>
        {item.products.length > 0 && (
          <Text style={styles.productsText}>
            {item.products.slice(0, 2).join(', ')}
            {item.products.length > 2 && ` +${item.products.length - 2} more`}
          </Text>
        )}
        <Text style={styles.detailText}>
          Last Updated: {new Date(item.lastUpdated).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business" size={80} color={COLORS.gray} />
      <Text style={styles.emptyTitle}>No racks found</Text>
      <Text style={styles.emptyText}>
        No racks match your current search or filter criteria.
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
          <Text style={styles.headerTitle}>Rack Management</Text>
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
            Manage warehouse racks, products, and inventory locations.
          </Text>
        </View>

        {/* Backend Status */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]}>
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
              <Text style={styles.statusText}>CONNECTED TO BACKEND</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.initButton} onPress={handleInitializeDatabase}>
            <Ionicons name="server" size={20} color={COLORS.white} />
            <Text style={styles.initButtonText}>Initialize Database</Text>
          </TouchableOpacity>
          
          <Text style={styles.instructionText}>
            If you see "no such table: racks" error, click this button to set up the database.
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <View style={styles.summaryCards}>
            <View style={[styles.summaryCard, styles.totalCard]}>
              <Ionicons name="business" size={24} color={COLORS.primary} />
              <Text style={styles.summaryNumber}>{totalRacks}</Text>
              <Text style={styles.summaryLabel}>Total Racks</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.activeCard]}>
              <Ionicons name="business" size={24} color={COLORS.success} />
              <Text style={styles.summaryNumber}>{activeRacks}</Text>
              <Text style={styles.summaryLabel}>Active Racks</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.inactiveCard]}>
              <Ionicons name="business" size={24} color={COLORS.error} />
              <Text style={styles.summaryNumber}>{inactiveRacks}</Text>
              <Text style={styles.summaryLabel}>Inactive Racks</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.productsCard]}>
              <Ionicons name="cube" size={24} color={COLORS.primary} />
              <Text style={styles.summaryNumber}>{totalProducts}</Text>
              <Text style={styles.summaryLabel}>Products</Text>
            </View>
          </View>
        </View>

        {/* Quick Search */}
        <View style={styles.quickSearchSection}>
          <Text style={styles.sectionTitle}>Quick Search</Text>
          <Text style={styles.sectionSubtitle}>
            Search by Rack ID or Rack Name to find product information
          </Text>
          <View style={styles.quickSearchContainer}>
            <View style={styles.quickSearchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
              <TextInput
                style={styles.quickSearchInput}
                placeholder="Enter Rack ID or Rack Name..."
                placeholderTextColor={COLORS.gray}
              />
            </View>
            <TouchableOpacity style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search racks, products, or IDs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color={COLORS.white} />
            <Text style={styles.filterButtonText}>{selectedStatus}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddNewRack}>
            <Ionicons name="add" size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add New Rack</Text>
          </TouchableOpacity>
        </View>

        {/* Racks List */}
        <View style={styles.racksSection}>
          <Text style={styles.sectionTitle}>Racks ({filteredRacks.length})</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading racks...</Text>
            </View>
          ) : filteredRacks.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredRacks}
              renderItem={renderRackItem}
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
    color: COLORS.white,
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: SIZES.padding * 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SIZES.padding,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  statusText: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    color: COLORS.white,
  },
  initButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
    alignSelf: 'flex-start',
    marginBottom: SIZES.paddingSmall,
  },
  initButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.padding,
  },
  sectionSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  summarySection: {
    marginBottom: SIZES.padding * 2,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.paddingSmall,
  },
  summaryCard: {
    flex: 1,
    minWidth: (SIZES.width - SIZES.padding * 3) / 2,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: SIZES.paddingSmall,
  },
  totalCard: {
    borderColor: COLORS.primary,
  },
  activeCard: {
    borderColor: COLORS.success,
  },
  inactiveCard: {
    borderColor: COLORS.error,
  },
  productsCard: {
    borderColor: COLORS.primary,
  },
  summaryNumber: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: SIZES.paddingSmall,
  },
  summaryLabel: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: SIZES.paddingSmall,
    textAlign: 'center',
  },
  quickSearchSection: {
    marginBottom: SIZES.padding * 2,
  },
  quickSearchContainer: {
    flexDirection: 'row',
    gap: SIZES.paddingSmall,
  },
  quickSearchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  quickSearchInput: {
    flex: 1,
    paddingVertical: SIZES.padding,
    fontSize: SIZES.body,
    color: COLORS.white,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
    gap: SIZES.paddingSmall,
    flexWrap: 'wrap',
  },
  searchInputContainer: {
    flex: 1,
    minWidth: 200,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  racksSection: {
    marginBottom: SIZES.padding,
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
  rackCard: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  rackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  rackInfo: {
    flex: 1,
  },
  rackName: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.white,
  },
  rackId: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  rackDetails: {
    gap: SIZES.paddingSmall / 2,
  },
  detailText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
  productsText: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
});

export default RackManagementScreen;
