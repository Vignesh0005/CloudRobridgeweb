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
  status: 'occupied' | 'free' | 'maintenance';
  capacity: number;
  currentLoad: number;
  lastUpdated: string;
}

interface RackStatusScreenProps {
  navigation: any;
}

const RackStatusScreen: React.FC<RackStatusScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [racks, setRacks] = useState<Rack[]>([]);
  const [filteredRacks, setFilteredRacks] = useState<Rack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const statusOptions = ['All Status', 'Occupied', 'Free', 'Maintenance'];

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
          status: 'occupied',
          capacity: 100,
          currentLoad: 75,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'R002',
          name: 'Rack A-02',
          location: 'Warehouse A',
          status: 'free',
          capacity: 100,
          currentLoad: 0,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'R003',
          name: 'Rack B-01',
          location: 'Warehouse B',
          status: 'maintenance',
          capacity: 100,
          currentLoad: 0,
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
        rack.id.toLowerCase().includes(searchQuery.toLowerCase())
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
    const csvHeader = 'ID,Name,Location,Status,Capacity,Current Load,Last Updated\n';
    const csvRows = filteredRacks.map(rack => 
      `${rack.id},"${rack.name}","${rack.location}",${rack.status},${rack.capacity},${rack.currentLoad},"${rack.lastUpdated}"`
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return COLORS.error;
      case 'free': return COLORS.success;
      case 'maintenance': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied': return 'checkmark-circle';
      case 'free': return 'close-circle';
      case 'maintenance': return 'warning';
      default: return 'help-circle';
    }
  };

  // Calculate summary statistics
  const totalRacks = racks.length;
  const occupiedRacks = racks.filter(rack => rack.status === 'occupied').length;
  const freeRacks = racks.filter(rack => rack.status === 'free').length;
  const maintenanceRacks = racks.filter(rack => rack.status === 'maintenance').length;
  const utilization = totalRacks > 0 ? Math.round((occupiedRacks / totalRacks) * 100) : 0;

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
          <Text style={styles.headerTitle}>Rack Status</Text>
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
            Monitor warehouse rack occupancy and status in real-time.
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCards}>
            <View style={[styles.summaryCard, styles.totalCard]}>
              <Ionicons name="business" size={24} color={COLORS.primary} />
              <Text style={styles.summaryNumber}>{totalRacks}</Text>
              <Text style={styles.summaryLabel}>Total Racks</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.occupiedCard]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.error} />
              <Text style={styles.summaryNumber}>{occupiedRacks}</Text>
              <Text style={styles.summaryLabel}>Occupied</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.freeCard]}>
              <Ionicons name="close-circle" size={24} color={COLORS.success} />
              <Text style={styles.summaryNumber}>{freeRacks}</Text>
              <Text style={styles.summaryLabel}>Free</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.maintenanceCard]}>
              <Ionicons name="warning" size={24} color={COLORS.warning} />
              <Text style={styles.summaryNumber}>{maintenanceRacks}</Text>
              <Text style={styles.summaryLabel}>Maintenance</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.utilizationCard]}>
              <Ionicons name="information-circle" size={24} color={COLORS.primary} />
              <Text style={styles.summaryNumber}>{utilization}%</Text>
              <Text style={styles.summaryLabel}>Utilization</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search racks by name, location, or ID"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray}
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color={COLORS.white} />
            <Text style={styles.filterButtonText}>{selectedStatus}</Text>
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
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.white,
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
  occupiedCard: {
    borderColor: COLORS.error,
  },
  freeCard: {
    borderColor: COLORS.success,
  },
  maintenanceCard: {
    borderColor: COLORS.warning,
  },
  utilizationCard: {
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
  statusText: {
    fontSize: SIZES.caption,
    fontWeight: '500',
  },
  rackDetails: {
    gap: SIZES.paddingSmall / 2,
  },
  detailText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
});

export default RackStatusScreen;