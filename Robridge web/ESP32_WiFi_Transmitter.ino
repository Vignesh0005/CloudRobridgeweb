/*
 * ESP32 Barcode Scanner WiFi Transmitter
 * 
 * This code receives barcode data from your ESP32 scanner
 * and transmits it to the Robridge Web application
 * 
 * Hardware Requirements:
 * - ESP32 board
 * - Barcode scanner module (already implemented)
 * - WiFi connection
 * 
 * Setup:
 * 1. Update WiFi credentials below
 * 2. Update server IP address to your computer's IP
 * 3. Upload this code to ESP32
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* serverIP = "192.168.1.100"; // Replace with your computer's IP address
const int serverPort = 3001;
String baseURL = "http://" + String(serverIP) + ":" + String(serverPort);

// ESP32 Device Configuration
const String deviceId = "ESP32_SCANNER_001";
const String deviceName = "ESP32-Barcode-Scanner";
const String firmwareVersion = "1.0.0";

// --- Product Database ---
struct Product {
    String barcode;
    String name;
    String type;
    String details;
};

Product products[50] = {
    {"8901180948385", "Apple", "Fruits", "Rich in vitamins, improves immunity."},
    {"8901180948386", "Faber-Castell Pencil", "Stationery", "High-quality pencil for smooth writing."},
    {"8901180948387", "Paracetamol", "Medical", "Pain reliever and fever reducer."},
    {"8901180948388", "Stapler", "Stationery", "Durable metal stapler, holds up to 20 sheets."},
    {"8901180948389", "Notebook", "Stationery", "200 pages, ruled sheets, good for school."},
    {"8901180948390", "Hand Sanitizer", "Medical", "Kills 99.9% germs, portable bottle."},
    {"8901180948391", "Eraser", "Stationery", "Soft and clean erasing."},
    {"8901180948392", "Glue Stick", "Stationery", "Non-toxic, safe for children."},
    {"8901180948393", "Vitamin C Tablet", "Medical", "Boosts immunity and skin health."},
    {"8901180948394", "Highlighter", "Stationery", "Fluorescent color, marks important text."},
    {"8901180948395", "Banana", "Fruits", "Potassium-rich, good for energy."},
    {"8901180948396", "Blue Pen", "Stationery", "Smooth ink, writes without skipping."},
    {"8901180948397", "Aspirin", "Medical", "Reduces pain, fever, and inflammation."},
    {"8901180948398", "Ruler", "Stationery", "30cm plastic ruler, accurate measurements."},
    {"8901180948399", "Orange", "Fruits", "Vitamin C rich, boosts immunity."},
    {"8901180948400", "Scissors", "Stationery", "Sharp, stainless steel for clean cuts."},
    {"8901180948401", "Cough Syrup", "Medical", "Relieves cough and throat irritation."},
    {"8901180948402", "Marker", "Stationery", "Permanent ink, vibrant color."},
    {"8901180948403", "Grapes", "Fruits", "Rich in antioxidants, good for skin."},
    {"8901180948404", "Sketch Pen", "Stationery", "Set of 12 colors, smooth drawing."},
    {"8901180948405", "Band-Aid", "Medical", "Covers small cuts and wounds."},
    {"8901180948406", "Pineapple", "Fruits", "Good for digestion and immunity."},
    {"8901180948407", "Notebook A4", "Stationery", "College-ruled, 100 sheets."},
    {"8901180948408", "Ibuprofen", "Medical", "Reduces pain and inflammation."},
    {"8901180948409", "Crayons", "Stationery", "Set of 16 colors, safe for kids."},
    {"8901180948410", "Mango", "Fruits", "Seasonal fruit, rich in vitamin A."},
    {"8901180948411", "Sharpener", "Stationery", "Metal sharpener, easy to use."},
    {"8901180948412", "Antiseptic Cream", "Medical", "Prevents infection on cuts."},
    {"8901180948413", "Watermelon", "Fruits", "Hydrating, rich in antioxidants."},
    {"8901180948414", "Pen Set", "Stationery", "Set of 5 gel pens, smooth writing."},
    {"8901180948415", "Digital Thermometer", "Medical", "Measures body temperature accurately."},
    {"8901180948416", "Cherry", "Fruits", "Small, sweet, rich in antioxidants."},
    {"8901180948417", "Binder Clips", "Stationery", "Holds documents securely."},
    {"8901180948418", "First Aid Kit", "Medical", "Essential items for emergencies."},
    {"8901180948419", "Papaya", "Fruits", "Good for digestion and skin."},
    {"8901180948420", "Correction Fluid", "Stationery", "Covers writing mistakes."},
    {"8901180948421", "Multivitamins", "Medical", "Supports overall health."},
    {"8901180948422", "Strawberry", "Fruits", "Rich in vitamin C, sweet taste."},
    {"8901180948423", "Sticky Notes", "Stationery", "Useful for reminders and notes."},
    {"8901180948424", "Antibiotic Ointment", "Medical", "Prevents bacterial infection."},
    {"8901180948425", "Kiwi", "Fruits", "High in vitamin C and fiber."},
    {"8901180948426", "Geometry Box", "Stationery", "Contains compass, protractor, ruler."},
    {"8901180948427", "Face Mask", "Medical", "Protects against dust and germs."},
    {"8901180948428", "Guava", "Fruits", "Rich in vitamin C, boosts immunity."},
    {"8901180948429", "Pen Holder", "Stationery", "Organizes pens and pencils."},
    {"8901180948430", "Oral Rehydration Salt", "Medical", "Replenishes fluids and electrolytes."},
    {"8901180948431", "Lemon", "Fruits", "Vitamin C rich, aids digestion."},
    {"8901180948432", "Notebook B5", "Stationery", "Compact, 120 pages."}
};

// Pin Configuration (adjust based on your setup)
const int SCAN_TRIGGER_PIN = 2;    // Pin to trigger barcode scan
const int SCAN_DATA_PIN = 4;       // Pin receiving barcode data
const int STATUS_LED_PIN = 5;      // Status LED

// Global Variables
String lastScannedBarcode = "";
unsigned long lastPingTime = 0;
unsigned long pingInterval = 30000; // Ping every 30 seconds
bool isRegistered = false;
unsigned long scanCount = 0;

// Function to lookup product by barcode
Product* lookupProduct(String scannedCode) {
  for (int i = 0; i < 50; i++) {
    if (products[i].barcode == scannedCode) {
      return &products[i];
    }
  }
  return nullptr;
}

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(SCAN_TRIGGER_PIN, INPUT_PULLUP);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  // Initialize WiFi
  setupWiFi();
  
  // Register device with server
  registerDevice();
  
  Serial.println("ESP32 Barcode Scanner Transmitter Ready");
  Serial.println("Waiting for barcode scans...");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    setupWiFi();
    registerDevice();
  }
  
  // Send periodic ping to server
  if (millis() - lastPingTime > pingInterval) {
    sendPing();
    lastPingTime = millis();
  }
  
  // Check for barcode scan trigger
  if (digitalRead(SCAN_TRIGGER_PIN) == LOW) {
    // Simulate barcode reading (replace with your actual barcode reading code)
    String barcodeData = readBarcodeFromScanner();
    
    if (barcodeData.length() > 0 && barcodeData != lastScannedBarcode) {
      lastScannedBarcode = barcodeData;
      scanCount++;
      
      Serial.println("Barcode scanned: " + barcodeData);
      
      // Send barcode data to server
      sendBarcodeScan(barcodeData);
      
      // Flash LED to indicate successful scan
      digitalWrite(STATUS_LED_PIN, HIGH);
      delay(200);
      digitalWrite(STATUS_LED_PIN, LOW);
    }
  }
  
  delay(100); // Small delay to prevent excessive CPU usage
}

void setupWiFi() {
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println();
    Serial.println("Failed to connect to WiFi. Please check credentials.");
  }
}

void registerDevice() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot register device - WiFi not connected");
    return;
  }
  
  HTTPClient http;
  http.begin(baseURL + "/api/esp32/register");
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["deviceName"] = deviceName;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["firmwareVersion"] = firmwareVersion;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Registering device with server...");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Registration response: " + response);
    
    if (httpResponseCode == 200) {
      isRegistered = true;
      Serial.println("Device registered successfully!");
      digitalWrite(STATUS_LED_PIN, HIGH);
      delay(1000);
      digitalWrite(STATUS_LED_PIN, LOW);
    }
  } else {
    Serial.println("Registration failed. HTTP error: " + String(httpResponseCode));
  }
  
  http.end();
}

void sendPing() {
  if (!isRegistered || WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  http.begin(baseURL + "/api/esp32/ping/" + deviceId);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST("{}");
  
  if (httpResponseCode == 200) {
    Serial.println("Ping successful");
  } else {
    Serial.println("Ping failed. HTTP error: " + String(httpResponseCode));
    if (httpResponseCode == 404) {
      // Device not found, try to re-register
      isRegistered = false;
      registerDevice();
    }
  }
  
  http.end();
}

void sendBarcodeScan(String barcodeData) {
  if (!isRegistered || WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send scan - device not registered or WiFi disconnected");
    return;
  }
  
  // Lookup product in local database
  Product* foundProduct = lookupProduct(barcodeData);
  
  HTTPClient http;
  http.begin(baseURL + "/api/esp32/scan/" + deviceId);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<500> doc;
  doc["barcodeData"] = barcodeData;
  doc["scanType"] = "QR_CODE"; // or "CODE128", "EAN13", etc.
  doc["timestamp"] = getCurrentTimestamp();
  
  // Include product information if found
  if (foundProduct != nullptr) {
    doc["productName"] = foundProduct->name;
    doc["productType"] = foundProduct->type;
    doc["productDetails"] = foundProduct->details;
    doc["foundInLocalDB"] = true;
    Serial.println("Product found: " + foundProduct->name + " (" + foundProduct->type + ")");
  } else {
    doc["foundInLocalDB"] = false;
    Serial.println("Product not found in local database");
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Sending barcode scan to server...");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Scan response: " + response);
    
    if (httpResponseCode == 200) {
      Serial.println("Barcode scan sent successfully!");
      
      // Parse response to get scan ID
      StaticJsonDocument<100> responseDoc;
      deserializeJson(responseDoc, response);
      
      if (responseDoc["success"]) {
        String scanId = responseDoc["scanId"];
        Serial.println("Scan ID: " + scanId);
      }
    }
  } else {
    Serial.println("Failed to send scan. HTTP error: " + String(httpResponseCode));
  }
  
  http.end();
}

String readBarcodeFromScanner() {
  // This function should be replaced with your actual barcode reading implementation
  // For demonstration, we'll simulate reading a barcode from our product database
  
  Serial.println("Reading barcode from scanner...");
  delay(500); // Simulate reading time
  
  // Return a random barcode from our product database for demonstration
  int randomIndex = random(0, 50);
  String selectedBarcode = products[randomIndex].barcode;
  
  Serial.println("Simulated scan: " + selectedBarcode + " (" + products[randomIndex].name + ")");
  return selectedBarcode;
}

String getCurrentTimestamp() {
  // Get current timestamp in ISO format
  // Note: This is a simplified version. For production, use proper time sync
  unsigned long currentTime = millis();
  return String(currentTime);
}

// Additional utility functions for production use:

/*
void syncTimeWithNTP() {
  // Use NTP to sync time for accurate timestamps
  configTime(0, 0, "pool.ntp.org");
  
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    Serial.println("Time synchronized successfully");
  }
}

String getISOTimestamp() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char buffer[30];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buffer);
  }
  return String(millis());
}

String encodeImageToBase64(uint8_t* imageData, size_t imageSize) {
  // Encode image data to base64 for transmission
  // Implementation depends on your image format
  return "";
}
*/
