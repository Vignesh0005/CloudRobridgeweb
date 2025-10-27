# Rack Status Page

## Overview
The Rack Status page provides a comprehensive view of warehouse rack availability and occupancy status. It displays which racks are empty or occupied with detailed product information.

## Features

### 📊 Statistics Dashboard
- **Total Racks**: Shows the total number of racks in the system
- **Occupied Racks**: Displays count of racks currently in use
- **Empty Racks**: Shows count of available racks

### 🔍 Filtering Options
- **All Racks**: View all racks regardless of status
- **Occupied Only**: Filter to show only occupied racks
- **Empty Only**: Filter to show only available racks

### 📱 Interactive Rack Cards
Each rack is displayed as a card showing:
- **Rack Name**: Unique identifier (e.g., "Rack A1", "Rack B2")
- **Status Indicator**: Color-coded dot (Green = Occupied, Orange = Empty)
- **Location**: 3D coordinates (x, y, z)
- **Product Information**: Name and ID for occupied racks
- **Last Updated**: Timestamp of last status change

### 🎯 User Interactions
- **Tap**: View detailed rack information
- **Long Press**: Toggle rack status (for demo purposes)
- **Pull to Refresh**: Update rack status from server
- **Filter Buttons**: Quick filtering by status

## Visual Design

### Color Coding
- 🟢 **Green**: Occupied racks with products
- 🟠 **Orange**: Empty/available racks
- 🔵 **Blue**: Primary brand color for headers and active states

### Layout
- **Grid Layout**: 2-column responsive grid for rack cards
- **Statistics Bar**: Top summary with key metrics
- **Filter Bar**: Quick access filter buttons
- **Responsive Design**: Adapts to different screen sizes

## Mock Data
The page includes sample data for demonstration:
- 9 racks across 3 sections (A, B, C)
- Mix of occupied and empty racks
- Realistic product information
- 3D location coordinates

## Navigation
- Accessible via the main drawer menu
- Grid icon in navigation
- "Rack Status" label

## Technical Implementation
- **React Native**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **Expo**: Development and deployment platform
- **React Navigation**: Drawer navigation integration
- **Ionicons**: Consistent iconography
- **Responsive Design**: Adaptive layouts

## Future Enhancements
- Real-time updates from backend API
- Barcode scanning integration for rack updates
- Search functionality
- Bulk operations
- Export capabilities
- Historical tracking
- Analytics and reporting

## Usage
1. Open the Robridge app
2. Navigate to "Rack Status" from the drawer menu
3. View rack statistics at the top
4. Use filter buttons to focus on specific rack types
5. Tap any rack card for detailed information
6. Long press to toggle status (demo feature)
7. Pull down to refresh data

This page provides warehouse managers with a clear, real-time view of rack utilization and helps optimize storage space allocation.
