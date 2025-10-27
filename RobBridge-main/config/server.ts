// Server configuration for the Robridge app
export const SERVER_CONFIG = {
  // Base URL for the Express server (Node.js backend)
  BASE_URL: 'https://robridge-express.onrender.com',
  
  // AI Server URL for AI analysis
  AI_SERVER_URL: 'https://robridge-ai.onrender.com',
  
  // API endpoints
  ENDPOINTS: {
    // Health and system
    HEALTH: '/api/health',
    SYSTEM_STATUS: '/api/system/status',
    
    // ESP32 device management
    ESP32_REGISTER: '/api/esp32/register',
    ESP32_PING: '/api/esp32/ping',
    ESP32_SCAN: '/api/esp32/scan',
    ESP32_DEVICES: '/api/esp32/devices',
    ESP32_LATEST_SCAN: '/api/esp32/latest-scan',
    
    // Barcode operations
    SAVE_SCAN: '/api/save-scan',
    SAVED_SCANS: '/api/saved-scans',
    BARCODES_SCANNED: '/api/barcodes/scanned',
    BARCODES_LOOKUP: '/api/barcodes/lookup',
    BARCODES_STATS: '/api/barcodes/stats',
    DELETE_BARCODE: '/api/barcodes',
    
    // Barcode generation (Python backend)
    GENERATE_BARCODE: '/api/generate_barcode',
    GET_BARCODE: '/api/get_barcode',
    LIST_BARCODES: '/api/list_barcodes',
    
    // AI analysis
    AI_ANALYZE: '/api/ai/analyze-product',
    
    // Rack Management
    GET_RACKS: '/api/racks',
    CREATE_RACK: '/api/racks',
    UPDATE_RACK: '/api/racks',
    DELETE_RACK: '/api/racks',
    RACK_STATS: '/api/racks/stats',
    RACK_SEARCH: '/api/racks/search',
    RACK_UPDATE_QUANTITY: '/api/racks',
    RACK_STATUS: '/api/rack-status',
    
    // Backend management
    START_BACKEND: '/api/start-backend',
    STOP_BACKEND: '/api/stop-backend',
    BACKEND_STATUS: '/api/backend-status',
    INIT_DB: '/api/init-db',
  },
  
  // Connection settings
  CONNECTION: {
    TIMEOUT: 15000, // 15 seconds for cloud servers
    RETRY_INTERVAL: 10000, // 10 seconds
  }
};

// Helper function to build full URLs
export const buildUrl = (endpoint: string): string => {
  return `${SERVER_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get full API URLs
export const API_URLS = {
  // Health and system
  HEALTH: buildUrl(SERVER_CONFIG.ENDPOINTS.HEALTH),
  SYSTEM_STATUS: buildUrl(SERVER_CONFIG.ENDPOINTS.SYSTEM_STATUS),
  
  // ESP32 device management
  ESP32_REGISTER: buildUrl(SERVER_CONFIG.ENDPOINTS.ESP32_REGISTER),
  ESP32_PING: (deviceId: string) => buildUrl(`${SERVER_CONFIG.ENDPOINTS.ESP32_PING}/${deviceId}`),
  ESP32_SCAN: (deviceId: string) => buildUrl(`${SERVER_CONFIG.ENDPOINTS.ESP32_SCAN}/${deviceId}`),
  ESP32_DEVICES: buildUrl(SERVER_CONFIG.ENDPOINTS.ESP32_DEVICES),
  ESP32_LATEST_SCAN: buildUrl(SERVER_CONFIG.ENDPOINTS.ESP32_LATEST_SCAN),
  
  // Barcode operations
  SAVE_SCAN: buildUrl(SERVER_CONFIG.ENDPOINTS.SAVE_SCAN),
  SAVED_SCANS: buildUrl(SERVER_CONFIG.ENDPOINTS.SAVED_SCANS),
  BARCODES_SCANNED: buildUrl(SERVER_CONFIG.ENDPOINTS.BARCODES_SCANNED),
  BARCODES_LOOKUP: (barcode: string) => buildUrl(`${SERVER_CONFIG.ENDPOINTS.BARCODES_LOOKUP}/${barcode}`),
  BARCODES_STATS: buildUrl(SERVER_CONFIG.ENDPOINTS.BARCODES_STATS),
  DELETE_BARCODE: (id: string) => buildUrl(`${SERVER_CONFIG.ENDPOINTS.DELETE_BARCODE}/${id}`),
  
  // Barcode generation (Python backend)
  GENERATE_BARCODE: buildUrl(SERVER_CONFIG.ENDPOINTS.GENERATE_BARCODE),
  GET_BARCODE: (filename: string) => buildUrl(`${SERVER_CONFIG.ENDPOINTS.GET_BARCODE}/${filename}`),
  LIST_BARCODES: buildUrl(SERVER_CONFIG.ENDPOINTS.LIST_BARCODES),
  
  // AI analysis
  AI_ANALYZE: buildUrl(SERVER_CONFIG.ENDPOINTS.AI_ANALYZE),
  
  // Rack Management
  GET_RACKS: buildUrl(SERVER_CONFIG.ENDPOINTS.GET_RACKS),
  CREATE_RACK: buildUrl(SERVER_CONFIG.ENDPOINTS.CREATE_RACK),
  UPDATE_RACK: (rackId: string) => buildUrl(`${SERVER_CONFIG.ENDPOINTS.UPDATE_RACK}/${rackId}`),
  DELETE_RACK: (rackId: string) => buildUrl(`${SERVER_CONFIG.ENDPOINTS.DELETE_RACK}/${rackId}`),
  RACK_STATS: buildUrl(SERVER_CONFIG.ENDPOINTS.RACK_STATS),
  RACK_SEARCH: buildUrl(SERVER_CONFIG.ENDPOINTS.RACK_SEARCH),
  RACK_UPDATE_QUANTITY: (rackId: string) => buildUrl(`${SERVER_CONFIG.ENDPOINTS.RACK_UPDATE_QUANTITY}/${rackId}/update-quantity`),
  RACK_STATUS: buildUrl(SERVER_CONFIG.ENDPOINTS.RACK_STATUS),
  
  // Backend management
  START_BACKEND: buildUrl(SERVER_CONFIG.ENDPOINTS.START_BACKEND),
  STOP_BACKEND: buildUrl(SERVER_CONFIG.ENDPOINTS.STOP_BACKEND),
  BACKEND_STATUS: buildUrl(SERVER_CONFIG.ENDPOINTS.BACKEND_STATUS),
  INIT_DB: buildUrl(SERVER_CONFIG.ENDPOINTS.INIT_DB),
  
  // AI Server URLs (separate server)
  AI_SERVER_HEALTH: `${SERVER_CONFIG.AI_SERVER_URL}/health`,
  AI_SERVER_ANALYZE: `${SERVER_CONFIG.AI_SERVER_URL}/api/esp32/scan`,
};
