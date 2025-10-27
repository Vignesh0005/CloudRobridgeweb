# Rack Management System

## Overview
The Rack Management System provides comprehensive warehouse rack management capabilities including adding new racks, updating rack status, and configuring rack settings. It integrates with the existing Rack Status page to provide a complete rack management solution.

## Components

### 1. Rack Management Screen (`RackManagementScreen.tsx`)
**Purpose**: Add, edit, and manage individual racks

**Features**:
- **Add New Racks**: Create racks with name, location, capacity, and description
- **Edit Rack Status**: Toggle between empty/occupied status
- **Product Assignment**: Assign products to occupied racks
- **Delete Racks**: Remove racks from the system
- **Statistics Display**: Show total, occupied, and empty rack counts
- **Interactive Cards**: Tap for details, long press for quick actions

**Key Functions**:
- `handleAddRack()`: Creates new racks with validation
- `handleEditRack()`: Opens edit modal for rack modifications
- `handleUpdateRackStatus()`: Updates rack occupancy status
- `handleDeleteRack()`: Removes racks with confirmation

### 2. Rack Settings Screen (`RackSettingsScreen.tsx`)
**Purpose**: Configure rack system settings and preferences

**Features**:
- **General Settings**: Auto-update, notifications, barcode integration
- **Capacity Settings**: Default capacity, low capacity thresholds
- **Naming Settings**: Auto-generation, prefixes, location formats
- **Sync Settings**: Server synchronization intervals
- **Action Buttons**: Save settings, reset to defaults

**Configuration Options**:
- Auto Update: Enable/disable automatic status updates
- Notifications: Toggle status change notifications
- Barcode Integration: Enable barcode scanning for racks
- Default Capacity: Set default weight capacity for new racks
- Low Capacity Threshold: Alert threshold percentage
- Max Racks Per Section: Limit racks per warehouse section
- Auto Generate Names: Automatic rack naming
- Name Prefix: Custom prefix for generated names
- Location Format: XYZ coordinates vs alphanumeric
- Sync Interval: Server sync frequency (1-30 minutes)

### 3. Backend API (`app.py`)
**Purpose**: Server-side rack management and data persistence

**Database Schema**:
```sql
CREATE TABLE racks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rack_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'empty',
    product_name TEXT,
    product_id TEXT,
    location_x INTEGER NOT NULL,
    location_y INTEGER NOT NULL,
    location_z INTEGER NOT NULL,
    capacity REAL DEFAULT 100.0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints**:
- `GET /api/racks` - Retrieve all racks
- `POST /api/racks` - Create new rack
- `PUT /api/racks/<rack_id>` - Update rack status/info
- `DELETE /api/racks/<rack_id>` - Delete rack
- `GET /api/racks/stats` - Get rack statistics

**Features**:
- **Authentication**: All endpoints require valid authentication
- **Validation**: Input validation and error handling
- **Logging**: System event logging for all operations
- **Statistics**: Real-time rack utilization metrics
- **Error Handling**: Comprehensive error responses

### 4. Integration with Rack Status
**Purpose**: Connect management features with status display

**Integration Points**:
- **Shared Data**: Both screens use the same rack data structure
- **Real-time Updates**: Changes in management reflect in status view
- **Consistent UI**: Matching design patterns and color schemes
- **Navigation**: Seamless navigation between management and status views

## User Workflow

### Adding a New Rack
1. Navigate to "Rack Management" from drawer menu
2. Tap the "+" button in the header
3. Fill in rack details:
   - Name (required)
   - Location coordinates (X, Y, Z)
   - Capacity in kg
   - Optional description
4. Tap "Add Rack" to create

### Managing Rack Status
1. View all racks in the management screen
2. Tap any rack card to view details
3. Use edit button to modify rack
4. Toggle between "Empty" and "Occupied" status
5. For occupied racks, enter product name and ID
6. Save changes

### Configuring Settings
1. Navigate to "Rack Settings" from drawer menu
2. Adjust settings in organized sections:
   - General settings (auto-update, notifications)
   - Capacity settings (thresholds, limits)
   - Naming settings (prefixes, formats)
   - Sync settings (intervals)
3. Tap "Save Settings" to apply changes
4. Use "Reset to Default" to restore defaults

## Technical Implementation

### Frontend Architecture
- **React Native**: Cross-platform mobile development
- **TypeScript**: Type-safe development with interfaces
- **Navigation**: Integrated with existing drawer navigation
- **State Management**: Local state with API integration
- **UI Components**: Consistent design system

### Backend Architecture
- **Flask**: Python web framework
- **SQLite**: Local database for data persistence
- **RESTful API**: Standard HTTP methods and responses
- **Authentication**: Token-based authentication
- **Error Handling**: Comprehensive error management

### Data Flow
1. **Frontend** → API calls → **Backend**
2. **Backend** → Database operations → **SQLite**
3. **Backend** → Response → **Frontend**
4. **Frontend** → State update → **UI refresh**

## Security Features
- **Authentication Required**: All rack operations require login
- **Input Validation**: Server-side validation of all inputs
- **Error Handling**: Secure error messages without data exposure
- **Logging**: Audit trail for all rack operations
- **Data Integrity**: Database constraints and validation

## Future Enhancements
- **Real-time Updates**: WebSocket integration for live updates
- **Barcode Integration**: Direct barcode scanning for rack assignment
- **Analytics**: Usage patterns and optimization insights
- **Bulk Operations**: Mass rack creation and updates
- **Export/Import**: Data backup and migration tools
- **Mobile Notifications**: Push notifications for status changes
- **Offline Support**: Local data caching and sync
- **Advanced Filtering**: Search and filter capabilities
- **Reporting**: Generate rack utilization reports
- **Integration**: Connect with external warehouse systems

## Usage Instructions

### For Warehouse Managers
1. **Setup**: Configure rack settings according to warehouse layout
2. **Initialization**: Add all existing racks to the system
3. **Daily Operations**: Update rack status as products move
4. **Monitoring**: Use Rack Status page for real-time overview
5. **Maintenance**: Use Rack Management for ongoing maintenance

### For Operators
1. **Status Updates**: Change rack status when loading/unloading
2. **Product Assignment**: Assign products to occupied racks
3. **Quick Actions**: Use long press for rapid status changes
4. **Information Access**: Tap racks for detailed information

This comprehensive rack management system provides warehouse teams with the tools needed to efficiently manage rack inventory, track product locations, and optimize warehouse operations.
