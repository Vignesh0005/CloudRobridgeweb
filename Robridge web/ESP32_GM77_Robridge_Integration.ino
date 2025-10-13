/*
 * ESP32 GM77 Barcode Scanner with Robridge Integration
 * 
 * This code combines:
 * - GM77 barcode scanner functionality
 * - OLED display with status information
 * - Gemini AI analysis
 * - Robridge web application integration
 * 
 * Hardware Requirements:
 * - ESP32 board
 * - GM77 barcode scanner (UART2: GPIO16 RX, GPIO17 TX)
 * - SH1106 OLED display (I2C: 0x3C)
 * - WiFi connection
 * 
 * Setup:
 * 1. Update WiFi credentials below
 * 2. Update server IP address to your computer's IP
 * 3. Upload this code to ESP32
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>   // Use SH1106/SH1107 driver
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- WiFi Configuration ---
const char* ssid = "Thin";
const char* password = "12345678";

// --- Robridge Server Configuration ---
const char* expressServerURL = "https://robridge-express.onrender.com";  // Express backend
const char* aiServerURL = "https://robridge-ai.onrender.com";  // AI server

// --- ESP32 Device Configuration ---
const String deviceId = "ESP32_GM77_SCANNER_001";
const String deviceName = "ESP32-GM77-Barcode-Scanner";
const String firmwareVersion = "2.0.0";

// --- Gemini API Configuration ---
const char* gemini_api_key = "AIzaSyASPgBz59it8cF3biu1q75RtuDesEeJc1M";
const char* gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// --- OLED Setup ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SH1106G display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);  // for SH1106

// --- GM77 Barcode Scanner on Serial2 ---
HardwareSerial GM77(2); // UART2 on ESP32 (GPIO16 RX, GPIO17 TX)

// --- Product Structure for Database Integration ---
struct Product {
    String barcode;
    String name;
    String type;
    String details;
    String price;
    String category;
    String location;
    bool foundInDatabase;
};

// --- AI Model Configuration ---
// Your trained AI model endpoint (from pipeline_config.json)
const char* ai_model_url = "https://robridge-ai.onrender.com/api/esp32/scan"; // AI server endpoint

// --- Status Variables ---
bool wifiConnected = false;
bool robridgeConnected = false;
bool apiProcessing = false;
String lastScannedCode = "";
String lastApiResponse = "";
unsigned long lastPingTime = 0;
unsigned long pingInterval = 30000; // Ping every 30 seconds
bool isRegistered = false;
unsigned long scanCount = 0;

// --- WiFi Auto-Reconnect Variables ---
unsigned long lastWiFiCheck = 0;
unsigned long wifiCheckInterval = 5000; // Check WiFi every 5 seconds
unsigned long lastReconnectAttempt = 0;
unsigned long reconnectDelay = 1000; // Start with 1 second delay
unsigned long maxReconnectDelay = 30000; // Max 30 seconds between attempts
int reconnectAttempts = 0;
int maxReconnectAttempts = 10;
bool wifiReconnectInProgress = false;
String lastWiFiStatus = "";
int wifiRSSI = 0;
unsigned long wifiConnectedTime = 0;

// --- Debug and Utility Functions ---
void debugPrint(String message, bool newline = true) {
  String timestamp = "[" + String(millis()) + "] ";
  if (newline) {
    Serial.println(timestamp + message);
  } else {
    Serial.print(timestamp + message);
  }
}

void debugPrintWiFiStatus() {
  debugPrint("=== WiFi Status Debug ===");
  debugPrint("WiFi Status: " + String(WiFi.status()));
  debugPrint("WiFi Connected: " + String(wifiConnected ? "YES" : "NO"));
  debugPrint("SSID: " + String(WiFi.SSID()));
  debugPrint("IP Address: " + WiFi.localIP().toString());
  debugPrint("RSSI: " + String(WiFi.RSSI()) + " dBm");
  debugPrint("Reconnect Attempts: " + String(reconnectAttempts));
  debugPrint("Reconnect In Progress: " + String(wifiReconnectInProgress ? "YES" : "NO"));
  debugPrint("Uptime: " + String((millis() - wifiConnectedTime) / 1000) + " seconds");
  debugPrint("========================");
}

String getWiFiStatusString(wl_status_t status) {
  switch (status) {
    case WL_NO_SSID_AVAIL: return "NO_SSID_AVAILABLE";
    case WL_SCAN_COMPLETED: return "SCAN_COMPLETED";
    case WL_CONNECTED: return "CONNECTED";
    case WL_CONNECT_FAILED: return "CONNECT_FAILED";
    case WL_CONNECTION_LOST: return "CONNECTION_LOST";
    case WL_DISCONNECTED: return "DISCONNECTED";
    case WL_IDLE_STATUS: return "IDLE_STATUS";
    default: return "UNKNOWN(" + String(status) + ")";
  }
}

void updateWiFiStatus() {
  wl_status_t currentStatus = WiFi.status();
  String statusString = getWiFiStatusString(currentStatus);
  
  if (statusString != lastWiFiStatus) {
    debugPrint("WiFi Status Changed: " + lastWiFiStatus + " -> " + statusString);
    lastWiFiStatus = statusString;
  }
  
  if (currentStatus == WL_CONNECTED) {
    wifiRSSI = WiFi.RSSI();
    if (!wifiConnected) {
      wifiConnectedTime = millis();
      debugPrint("WiFi Connected Successfully!");
      debugPrint("IP: " + WiFi.localIP().toString());
      debugPrint("RSSI: " + String(wifiRSSI) + " dBm");
    }
    wifiConnected = true;
    reconnectAttempts = 0;
    reconnectDelay = 1000; // Reset delay
    wifiReconnectInProgress = false;
  } else {
    if (wifiConnected) {
      debugPrint("WiFi Connection Lost!");
      wifiConnected = false;
      robridgeConnected = false;
      isRegistered = false;
    }
  }
}

bool attemptWiFiReconnect() {
  if (wifiReconnectInProgress) {
    return false;
  }
  
  unsigned long currentTime = millis();
  if (currentTime - lastReconnectAttempt < reconnectDelay) {
    return false;
  }
  
  if (reconnectAttempts >= maxReconnectAttempts) {
    debugPrint("Max reconnect attempts reached. Resetting attempts.");
    reconnectAttempts = 0;
    reconnectDelay = 1000;
  }
  
  wifiReconnectInProgress = true;
  lastReconnectAttempt = currentTime;
  reconnectAttempts++;
  
  debugPrint("WiFi Reconnect Attempt #" + String(reconnectAttempts));
  debugPrint("Current Status: " + getWiFiStatusString(WiFi.status()));
  
  // Disconnect first to ensure clean connection
  if (WiFi.status() != WL_DISCONNECTED) {
    debugPrint("Disconnecting from WiFi...");
    WiFi.disconnect(true);
    delay(1000);
  }
  
  debugPrint("Attempting to connect to: " + String(ssid));
  WiFi.begin(ssid, password);
  
  // Wait for connection with timeout
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startTime) < 10000) {
    delay(100);
    if ((millis() - startTime) % 1000 == 0) {
      debugPrint("Connection attempt in progress...", false);
      Serial.print(".");
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    debugPrint("WiFi Reconnection Successful!");
    wifiReconnectInProgress = false;
    return true;
  } else {
    debugPrint("WiFi Reconnection Failed. Status: " + getWiFiStatusString(WiFi.status()));
    wifiReconnectInProgress = false;
    
    // Exponential backoff
    reconnectDelay = min(reconnectDelay * 2, maxReconnectDelay);
    debugPrint("Next reconnect attempt in " + String(reconnectDelay / 1000) + " seconds");
    return false;
  }
}

void checkWiFiConnection() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastWiFiCheck < wifiCheckInterval) {
    return;
  }
  
  lastWiFiCheck = currentTime;
  updateWiFiStatus();
  
  if (!wifiConnected && !wifiReconnectInProgress) {
    debugPrint("WiFi not connected, attempting reconnection...");
    attemptWiFiReconnect();
  }
  
  // Log periodic status
  if (wifiConnected) {
    debugPrint("WiFi Health Check - RSSI: " + String(WiFi.RSSI()) + " dBm, Uptime: " + String((millis() - wifiConnectedTime) / 1000) + "s");
  }
}

// Function to clean raw data
String cleanBarcode(String rawData) {
  Serial.println("Raw barcode data: '" + rawData + "'");
  Serial.println("Raw data length: " + String(rawData.length()));
  
  // Remove all non-numeric characters and trim
  String cleaned = "";
  for (int i = 0; i < rawData.length(); i++) {
    char c = rawData[i];
    if (c >= '0' && c <= '9') {  // Keep only digits
      cleaned += c;
    }
  }
  
  Serial.println("Cleaned barcode: '" + cleaned + "'");
  Serial.println("Cleaned length: " + String(cleaned.length()));
  return cleaned;
}

// Function to lookup product in SQL database
Product lookupProductInDatabase(String scannedCode) {
  Product product;
  product.barcode = scannedCode;
  product.foundInDatabase = false;
  
  if (!wifiConnected) {
    debugPrint("Cannot lookup product - WiFi not connected");
    return product;
  }
  
  HTTPClient http;
  http.begin(String(expressServerURL) + "/api/barcodes/lookup/" + scannedCode);
  http.addHeader("Content-Type", "application/json");
  
  debugPrint("Looking up barcode in database: " + scannedCode);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    debugPrint("Database lookup response: " + response);
    
    if (httpResponseCode == 200) {
      // Parse JSON response
      DynamicJsonDocument doc(1024);
      deserializeJson(doc, response);
      
      if (doc["success"] && doc["product"]) {
        product.name = doc["product"]["name"].as<String>();
        product.type = doc["product"]["type"].as<String>();
        product.details = doc["product"]["details"].as<String>();
        product.price = doc["product"]["price"].as<String>();
        product.category = doc["product"]["category"].as<String>();
        product.location = doc["product"]["location"].as<String>();
        product.foundInDatabase = true;
        
        debugPrint("Product found in database: " + product.name);
      }
    }
  } else {
    debugPrint("Database lookup failed. HTTP error: " + String(httpResponseCode));
  }
  
  http.end();
  return product;
}

// Function to analyze product using trained AI model
Product analyzeProductWithAI(String scannedCode) {
  Product product;
  product.barcode = scannedCode;
  product.foundInDatabase = false;
  
  if (!wifiConnected) {
    debugPrint("Cannot analyze product with AI - WiFi not connected");
    return product;
  }
  
  HTTPClient http;
  http.begin(ai_model_url);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload matching the AI server API format
  StaticJsonDocument<300> doc;
  doc["barcodeData"] = scannedCode;
  doc["deviceId"] = deviceId;
  doc["deviceName"] = deviceName;
  doc["scanType"] = "GM77_SCAN";
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  debugPrint("Sending barcode to trained AI model: " + scannedCode);
  
  int httpResponseCode = http.POST(jsonString);
  ```````````
  if (httpResponseCode > 0) {
    String response = http.getString();
    debugPrint("Trained AI model response: " + response);
    
    if (httpResponseCode == 200) {
      // Parse JSON response from AI server
      DynamicJsonDocument responseDoc(2048);
      deserializeJson(responseDoc, response);
      
      if (responseDoc["success"]) {
        String title = responseDoc["title"].as<String>();
        String category = responseDoc["category"].as<String>();
        String description = responseDoc["description"].as<String>();
        String country = responseDoc["country"].as<String>();
        
        // Parse the AI-generated response to extract product info
        product.name = title;
        product.type = category;
        product.details = description;
        product.price = "Price not available";
        product.category = category;
        product.location = country;
        product.foundInDatabase = false; // This is AI-generated, not from database
        
        debugPrint("Product analyzed by AI server: " + title + " - " + category);
      }
    }
  } else {
    debugPrint("Trained AI analysis failed. HTTP error: " + String(httpResponseCode));
  }
  
  http.end();
  return product;
}

// Function to call trained AI model for benefits analysis
String callAIBenefitsAnalysis(String barcodeData, String productName) {
  if (!wifiConnected) {
    return "WiFi not connected";
  }
  
  HTTPClient http;
  http.begin(ai_model_url);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload for benefits analysis using AI server
  StaticJsonDocument<300> doc;
  doc["barcodeData"] = barcodeData;
  doc["deviceId"] = deviceId;
  doc["deviceName"] = deviceName;
  doc["scanType"] = "BENEFITS_ANALYSIS";
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  debugPrint("Requesting benefits analysis from trained AI for: " + productName);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    debugPrint("Trained AI benefits response: " + response);
    
    if (httpResponseCode == 200) {
      // Parse JSON response from AI server
      DynamicJsonDocument responseDoc(1024);
      deserializeJson(responseDoc, response);
      
      if (responseDoc["success"]) {
        String description = responseDoc["description"].as<String>();
        return description;
      }
    }
  }
  
  http.end();
  return "Trained AI analysis unavailable";
}

// Function to connect to WiFi (Enhanced with Debug)
void connectToWiFi() {
  debugPrint("=== Initial WiFi Connection ===");
  debugPrint("SSID: " + String(ssid));
  debugPrint("Password: [HIDDEN]");
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("Connecting to WiFi...");
  display.display();
  
  debugPrint("Starting WiFi connection...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  int maxAttempts = 20;
  
  debugPrint("Waiting for connection (max " + String(maxAttempts) + " attempts)...");
  
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    attempts++;
    
    // Update display with progress
    display.print(".");
    display.display();
    
    // Debug progress every 2 seconds
    if (attempts % 4 == 0) {
      debugPrint("Connection attempt " + String(attempts) + "/" + String(maxAttempts) + " - Status: " + getWiFiStatusString(WiFi.status()));
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    wifiConnectedTime = millis();
    wifiRSSI = WiFi.RSSI();
    
    debugPrint("WiFi Connection Successful!");
    debugPrint("IP Address: " + WiFi.localIP().toString());
    debugPrint("RSSI: " + String(wifiRSSI) + " dBm");
    debugPrint("Connection time: " + String(attempts * 500) + " ms");
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi Connected!");
    display.print("IP: ");
    display.println(WiFi.localIP());
    display.print("RSSI: ");
    display.print(String(wifiRSSI));
    display.println(" dBm");
    display.display();
    delay(2000);
    
    // Register with Robridge server
    debugPrint("Attempting to register with Robridge server...");
    registerWithRobridge();
  } else {
    wifiConnected = false;
    robridgeConnected = false;
    
    debugPrint("WiFi Connection Failed!");
    debugPrint("Final Status: " + getWiFiStatusString(WiFi.status()));
    debugPrint("Attempts made: " + String(attempts));
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi Failed!");
    display.println("Status: " + getWiFiStatusString(WiFi.status()));
    display.println("Check credentials");
    display.display();
    delay(3000);
  }
  
  debugPrint("=== WiFi Connection Complete ===");
}

// Function to register with Robridge server
void registerWithRobridge() {
  if (!wifiConnected) {
    return;
  }
  
  HTTPClient http;
  http.begin(String(expressServerURL) + "/api/esp32/register");
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["deviceName"] = deviceName;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["firmwareVersion"] = firmwareVersion;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Registering with Robridge server...");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Registration response: " + response);
    
    if (httpResponseCode == 200) {
      isRegistered = true;
      robridgeConnected = true;
      Serial.println("Registered with Robridge successfully!");
    }
  } else {
    Serial.println("Robridge registration failed. HTTP error: " + String(httpResponseCode));
    robridgeConnected = false;
  }
  
  http.end();
}

// Function to send ping to Robridge server
void sendPingToRobridge() {
  if (!isRegistered || !wifiConnected) {
    return;
  }
  
  HTTPClient http;
  http.begin(String(expressServerURL) + "/api/esp32/ping/" + deviceId);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST("{}");
  
  if (httpResponseCode == 200) {
    Serial.println("Ping to Robridge successful");
    robridgeConnected = true;
  } else {
    Serial.println("Ping to Robridge failed. HTTP error: " + String(httpResponseCode));
    if (httpResponseCode == 404) {
      // Device not found, try to re-register
      isRegistered = false;
      robridgeConnected = false;
      registerWithRobridge();
    }
  }
  
  http.end();
}

// Function to send barcode scan to Robridge server
void sendScanToRobridge(String barcodeData, Product* product = nullptr) {
  if (!isRegistered || !wifiConnected) {
    Serial.println("Cannot send scan to Robridge - not registered or WiFi disconnected");
    return;
  }
  
  HTTPClient http;
  http.begin(String(expressServerURL) + "/api/esp32/scan/" + deviceId);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  StaticJsonDocument<500> doc;
  doc["barcodeData"] = barcodeData;
  doc["scanType"] = "GM77_SCAN";
  doc["timestamp"] = getCurrentTimestamp();
  
  // Include product information if found
  if (product != nullptr) {
    doc["productName"] = product->name;
    doc["productType"] = product->type;
    doc["productDetails"] = product->details;
    doc["productPrice"] = product->price;
    doc["productCategory"] = product->category;
    doc["productLocation"] = product->location;
    doc["foundInDatabase"] = product->foundInDatabase;
    doc["source"] = product->foundInDatabase ? "database" : "ai_analysis";
    Serial.println("Product found: " + product->name + " (" + product->type + ")");
    Serial.println("Source: " + String(product->foundInDatabase ? "Database" : "AI Analysis"));
  } else {
    doc["foundInDatabase"] = false;
    doc["source"] = "unknown";
    Serial.println("Product not found - no data available");
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Sending scan to Robridge server...");
  Serial.println("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Robridge scan response: " + response);
    
    if (httpResponseCode == 200) {
      Serial.println("Scan sent to Robridge successfully!");
      scanCount++;
      
      // Parse response to get scan ID
      StaticJsonDocument<100> responseDoc;
      deserializeJson(responseDoc, response);
      
      if (responseDoc["success"]) {
        String scanId = responseDoc["scanId"];
        Serial.println("Robridge Scan ID: " + scanId);
      }
    }
  } else {
    Serial.println("Failed to send scan to Robridge. HTTP error: " + String(httpResponseCode));
  }
  
  http.end();
}

// Function to call Gemini API
String callGeminiAPI(String barcodeData) {
  if (!wifiConnected) {
    return "WiFi not connected";
  }
  
  HTTPClient http;
  http.begin(gemini_api_url + String("?key=") + gemini_api_key);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"contents\":[{";
  jsonPayload += "\"parts\":[{";
  jsonPayload += "\"text\":\"Analyze this barcode data and provide information about the product: " + barcodeData + "\"";
  jsonPayload += "}]";
  jsonPayload += "}]";
  jsonPayload += "}";
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    http.end();
    
    // Parse JSON response
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, response);
    
    if (doc["candidates"][0]["content"]["parts"][0]["text"]) {
      return doc["candidates"][0]["content"]["parts"][0]["text"].as<String>();
    } else {
      return "Error parsing API response";
    }
  } else {
    http.end();
    return "API Error: " + String(httpResponseCode);
  }
}

// Function to display text with proper word wrapping
void displayText(String text, int startY = 0) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  
  int y = startY;
  int maxCharsPerLine = 20; // Reduced to prevent overlapping
  int maxLines = (SCREEN_HEIGHT - startY) / 8;
  int currentLine = 0;
  
  // Split text by newlines first
  String lines[8]; // Max 8 lines
  int lineCount = 0;
  int lastIndex = 0;
  
  // Split by \n characters
  for (int i = 0; i <= text.length() && lineCount < 8; i++) {
    if (i == text.length() || text.charAt(i) == '\n') {
      lines[lineCount] = text.substring(lastIndex, i);
      lineCount++;
      lastIndex = i + 1;
    }
  }
  
  // Display each line with word wrapping
  for (int line = 0; line < lineCount && currentLine < maxLines; line++) {
    String lineText = lines[line];
    
    // If line is too long, break it into multiple lines
    while (lineText.length() > maxCharsPerLine && currentLine < maxLines) {
      String displayLine = lineText.substring(0, maxCharsPerLine);
      
      // Try to break at a space
      int breakPoint = displayLine.lastIndexOf(' ');
      if (breakPoint > maxCharsPerLine - 10) { // If space is not too far back
        displayLine = lineText.substring(0, breakPoint);
        lineText = lineText.substring(breakPoint + 1);
      } else {
        lineText = lineText.substring(maxCharsPerLine);
      }
      
      display.setCursor(0, y);
      display.println(displayLine);
      y += 8;
      currentLine++;
    }
    
    // Display remaining part of line
    if (lineText.length() > 0 && currentLine < maxLines) {
      display.setCursor(0, y);
      display.println(lineText);
      y += 8;
      currentLine++;
    }
  }
  
  display.display();
}

// Function to display status screen (Enhanced with WiFi details)
void displayStatusScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("BVS-110 Scanner Ready");
  
  // WiFi status with details
  if (wifiConnected) {
    display.println("WiFi: Connected");
    display.println("RSSI: " + String(wifiRSSI) + " dBm");
    display.println("Uptime: " + String((millis() - wifiConnectedTime) / 1000) + "s");
  } else {
    display.println("WiFi: Disconnected");
    if (wifiReconnectInProgress) {
      display.println("Reconnecting...");
    } else {
      display.println("Attempts: " + String(reconnectAttempts));
    }
  }
  
  display.println("Robridge: " + String(robridgeConnected ? "Connected" : "Disconnected"));
  display.println("Database: SQL Integrated");
  display.println("AI Model: Trained LLM");
  display.println("Scans: " + String(scanCount));
  display.println("Last: " + lastScannedCode);
  display.display();
}

// Function to display AI analysis process
void displayAIAnalysisProcess(String barcodeData) {
  // Step 1: Connecting to AI service
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("AI Analysis Process");
  display.println("==================");
  display.println("");
  display.println("Step 1: Connecting to");
  display.println("Gemini AI service...");
  display.display();
  delay(1500);
  
  // Step 2: Analyzing barcode
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("AI Analysis Process");
  display.println("==================");
  display.println("");
  display.println("Step 2: Analyzing");
  display.println("barcode data...");
  display.println("Barcode: " + barcodeData);
  display.display();
  delay(1500);
  
  // Step 3: Processing with AI
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("AI Analysis Process");
  display.println("==================");
  display.println("");
  display.println("Step 3: AI processing");
  display.println("product information...");
  display.println("");
  display.println("Please wait...");
  display.display();
  delay(2000);
  
  // Call Gemini API for analysis
  String aiResponse = callGeminiAPI(barcodeData);
  
  // Step 4: Display AI results
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("AI Analysis Complete");
  display.println("===================");
  display.println("");
  display.println("AI Response:");
  display.println(aiResponse.length() > 0 ? "Analysis received" : "No response");
  display.display();
  delay(3000);
  
  // If we got a response, show it
  if (aiResponse.length() > 0 && aiResponse != "WiFi not connected" && !aiResponse.startsWith("API Error")) {
    displayText("AI Analysis Result:\n\n" + aiResponse);
    delay(5000);
  } else {
    // Show error or fallback message
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SH110X_WHITE);
    display.setCursor(0, 0);
    display.println("AI Analysis Failed");
    display.println("=================");
    display.println("");
    display.println("Reason: " + aiResponse);
    display.println("");
    display.println("Using fallback");
    display.println("identification...");
    display.display();
    delay(3000);
  }
}

String getCurrentTimestamp() {
  // Get current timestamp in ISO format
  // Note: This is a simplified version. For production, use proper time sync
  unsigned long currentTime = millis();
  return String(currentTime);
}

// Logo bitmap data
static const unsigned char PROGMEM logo16_glcd_bmp[] =
{
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x70, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0xe0, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x00, 0x78, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0xf8, 0x00, 0x00, 0xff, 0xf8, 0x00, 0x00, 0x78, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0xfc, 0x00, 0x00, 0xff, 0x3c, 0x00, 0x00, 0x78, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0xbe, 0x00, 0x00, 0xff, 0x3e, 0x00, 0x00, 0x78, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0xbe, 0x00, 0x00, 0xfe, 0x1e, 0x00, 0x00, 0x30, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0x9f, 0x00, 0x00, 0xfe, 0x1e, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0x9f, 0x00, 0x00, 0x06, 0x3f, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0x1f, 0x00, 0x00, 0x06, 0x3f, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0f, 0x1f, 0x80, 0x00, 0xfe, 0xff, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0e, 0x0f, 0x80, 0x00, 0xfc, 0xff, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0e, 0x0f, 0x80, 0x00, 0xfd, 0xff, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x0e, 0x0f, 0x80, 0xf0, 0x01, 0xff, 0x06, 0x00, 0x70, 0x07, 0x0e, 0x00, 0x60, 0x00, 0x1c, 0x00, 
  0x0e, 0x07, 0x83, 0xfc, 0x03, 0xff, 0x07, 0x3c, 0x70, 0x1f, 0xce, 0x01, 0xf9, 0xc0, 0x7f, 0x00, 
  0x0e, 0x0f, 0x83, 0xfc, 0x7f, 0xff, 0x07, 0x7c, 0x70, 0x1f, 0xce, 0x03, 0xf9, 0xc0, 0x7f, 0x80, 
  0x0e, 0x8f, 0x87, 0xfe, 0x7f, 0xff, 0x07, 0x78, 0x70, 0x3f, 0xee, 0x07, 0xfd, 0xc0, 0xff, 0xc0, 
  0x0f, 0x2f, 0x8f, 0xff, 0x7f, 0xff, 0x07, 0xf8, 0x70, 0x3c, 0xfe, 0x07, 0x9d, 0xc1, 0xe3, 0xc0, 
  0x0f, 0xff, 0x0f, 0x0f, 0x3f, 0x9f, 0x07, 0xf8, 0x70, 0x78, 0x3e, 0x0f, 0x07, 0xc1, 0xc1, 0xe0, 
  0x0e, 0x0f, 0x1e, 0x07, 0x3f, 0x8e, 0x07, 0xc0, 0x70, 0x70, 0x1e, 0x0e, 0x07, 0xc3, 0x80, 0xe0, 
  0x0e, 0x0f, 0x1e, 0x07, 0xbf, 0x8e, 0x07, 0xc0, 0x70, 0x70, 0x1e, 0x1e, 0x03, 0xc3, 0x80, 0xe0, 
  0x0f, 0x0f, 0x1c, 0x03, 0x9f, 0x04, 0x07, 0x80, 0x70, 0xe0, 0x1e, 0x1c, 0x03, 0xc3, 0x80, 0x60, 
  0x0f, 0x1e, 0x1c, 0x03, 0x80, 0x06, 0x07, 0x00, 0x70, 0xe0, 0x0e, 0x1c, 0x01, 0xc3, 0x00, 0x70, 
  0x0f, 0x1e, 0x3c, 0x03, 0x9f, 0x0f, 0x07, 0x00, 0x70, 0xe0, 0x0e, 0x1c, 0x01, 0xc7, 0x00, 0x70, 
  0x0f, 0xfc, 0x38, 0x01, 0xdf, 0x8f, 0x07, 0x00, 0x70, 0xe0, 0x0e, 0x18, 0x01, 0xc7, 0x00, 0x70, 
  0x0f, 0x1c, 0x38, 0x01, 0xdf, 0x8f, 0x07, 0x00, 0x70, 0xe0, 0x0e, 0x18, 0x01, 0xc7, 0x00, 0x70, 
  0x0f, 0x9c, 0x38, 0x01, 0xdf, 0xff, 0x87, 0x00, 0x70, 0xe0, 0x0e, 0x18, 0x01, 0xc7, 0xff, 0xf0, 
  0x0f, 0x9c, 0x38, 0x01, 0xdf, 0xff, 0x87, 0x00, 0x70, 0xe0, 0x0e, 0x18, 0x01, 0xc7, 0xff, 0xf0, 
  0x0f, 0x9c, 0x38, 0x01, 0xdf, 0xff, 0x87, 0x00, 0x70, 0xe0, 0x0e, 0x18, 0x01, 0xc7, 0xff, 0xf0, 
  0x0f, 0x9c, 0x38, 0x01, 0xdf, 0xff, 0x87, 0x00, 0x70, 0xe0, 0x0e, 0x18, 0x01, 0xc7, 0x00, 0x00, 
  0x0f, 0x9e, 0x38, 0x01, 0x83, 0xff, 0x87, 0x00, 0x70, 0xe0, 0x0e, 0x1c, 0x01, 0xc7, 0x00, 0x00, 
  0x0f, 0x9e, 0x3c, 0x03, 0x81, 0xff, 0x87, 0x00, 0x70, 0xe0, 0x0e, 0x1c, 0x01, 0xc7, 0x00, 0x00, 
  0x0f, 0x9e, 0x1c, 0x03, 0x9c, 0xff, 0x87, 0x00, 0x70, 0xe0, 0x0e, 0x1c, 0x01, 0xc3, 0x00, 0x00, 
  0x0f, 0x9e, 0x1c, 0x03, 0x9e, 0xff, 0x87, 0x00, 0x70, 0xe0, 0x1e, 0x1c, 0x03, 0xc3, 0x80, 0x60, 
  0x0f, 0xbe, 0x1e, 0x07, 0xbe, 0x3f, 0x87, 0x00, 0x70, 0x70, 0x1e, 0x0e, 0x03, 0xc3, 0x80, 0xe0, 
  0x0f, 0xbf, 0x1e, 0x07, 0x26, 0x3f, 0x07, 0x00, 0x70, 0x70, 0x1e, 0x0e, 0x07, 0xc3, 0xc0, 0xe0, 
  0x0f, 0x9f, 0x0f, 0x0f, 0x06, 0x1f, 0x07, 0x00, 0x70, 0x78, 0x3e, 0x0f, 0x07, 0xc1, 0xc1, 0xe0, 
  0x0f, 0x9f, 0x0f, 0xff, 0x06, 0x1f, 0x07, 0x00, 0x70, 0x3c, 0x6e, 0x07, 0x9d, 0xc1, 0xf7, 0xc0, 
  0x0f, 0x9f, 0x07, 0xfe, 0x06, 0x3e, 0x07, 0x00, 0x70, 0x3f, 0xee, 0x07, 0xfd, 0xc0, 0xff, 0x80, 
  0x0f, 0x9f, 0x83, 0xfc, 0xc7, 0x3e, 0x07, 0x00, 0x70, 0x1f, 0xce, 0x03, 0xf9, 0xc0, 0xff, 0x80, 
  0x0f, 0x9f, 0x83, 0xf8, 0xe7, 0xfc, 0x07, 0x00, 0x70, 0x0f, 0xce, 0x01, 0xf1, 0xc0, 0x3f, 0x00, 
  0x00, 0x00, 0x00, 0xf0, 0xef, 0xe0, 0x06, 0x00, 0x00, 0x07, 0x00, 0x00, 0x41, 0xc0, 0x1c, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xc0, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x80, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x80, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x03, 0x80, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x03, 0x80, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0e, 0x07, 0x80, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0f, 0x0f, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0xff, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0xfe, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xfc, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0xfc, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};

void setup() {
  Serial.begin(9600);
  delay(1000); // Give serial time to initialize
  
  debugPrint("=== ESP32 GM77 Barcode Scanner Starting ===");
  debugPrint("Firmware Version: " + String(firmwareVersion));
  debugPrint("Device ID: " + String(deviceId));
  debugPrint("Device Name: " + String(deviceName));

  // Init GM77 scanner (baud: 9600, RX=16, TX=17)
  debugPrint("Initializing GM77 barcode scanner...");
  GM77.begin(9600, SERIAL_8N1, 16, 17);
  debugPrint("GM77 scanner initialized on UART2 (GPIO16 RX, GPIO17 TX)");

  // Init OLED (I2C addr = 0x3C)
  debugPrint("Initializing OLED display...");
  if (!display.begin(0x3C, true)) {
    debugPrint("ERROR: OLED init failed! Check wiring or address.");
    for (;;);
  }
  debugPrint("OLED display initialized successfully");

  // Show logo
  debugPrint("Displaying startup logo...");
  display.clearDisplay();
  display.drawBitmap(0, 0, logo16_glcd_bmp, 128, 64, 1);
  display.display();
  delay(3000);
  
  // Initialize WiFi variables
  debugPrint("Initializing WiFi variables...");
  lastWiFiCheck = 0;
  reconnectAttempts = 0;
  wifiReconnectInProgress = false;
  wifiConnected = false;
  robridgeConnected = false;
  isRegistered = false;
  
  // Connect to WiFi and register with Robridge
  debugPrint("Starting WiFi connection process...");
  connectToWiFi();
  
  // Show ready message
  debugPrint("System initialization complete. Showing status screen...");
  displayStatusScreen();
  
  debugPrint("=== System Ready ===");
  debugPrint("Available debug commands: wifi_status, wifi_reconnect, wifi_scan, help");
}

void loop() {
  // Enhanced WiFi monitoring and auto-reconnect
  checkWiFiConnection();
  
  // Check for debug commands via Serial
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "wifi_status") {
      debugPrintWiFiStatus();
    } else if (command == "wifi_reconnect") {
      debugPrint("Manual WiFi reconnect requested...");
      attemptWiFiReconnect();
    } else if (command == "wifi_scan") {
      debugPrint("Scanning for available networks...");
      int networks = WiFi.scanNetworks();
      debugPrint("Found " + String(networks) + " networks:");
      for (int i = 0; i < networks; i++) {
        debugPrint("  " + String(i+1) + ": " + WiFi.SSID(i) + " (RSSI: " + String(WiFi.RSSI(i)) + " dBm)");
      }
    } else if (command == "help") {
      debugPrint("Available commands:");
      debugPrint("  wifi_status - Show detailed WiFi status");
      debugPrint("  wifi_reconnect - Force WiFi reconnection");
      debugPrint("  wifi_scan - Scan for available networks");
      debugPrint("  help - Show this help message");
    }
  }
  
  // Send periodic ping to Robridge server (only if connected)
  if (wifiConnected && millis() - lastPingTime > pingInterval) {
    debugPrint("Sending periodic ping to Robridge server...");
    sendPingToRobridge();
    lastPingTime = millis();
  }
  
  // Check for barcode scan
  if (GM77.available()) {
    // Read until newline
    String rawData = GM77.readStringUntil('\n');
    String barcodeData = cleanBarcode(rawData);

    if (barcodeData.length() > 0) {
      lastScannedCode = barcodeData;
      
      // Print clean data to serial
      Serial.print("Clean Barcode: ");
      Serial.println(barcodeData);

      // Show AI Analysis message briefly
      display.clearDisplay();
      display.setTextSize(1);
      display.setTextColor(SH110X_WHITE);
      display.setCursor(0, 0);
      display.println("AI Analysis...");
      display.println("");
      display.println("Processing barcode:");
      display.println(barcodeData);
      display.display();
      delay(2000); // Show AI Analysis for 2 seconds

      // Step 1: Lookup product in SQL database
      display.clearDisplay();
      display.setTextSize(1);
      display.setTextColor(SH110X_WHITE);
      display.setCursor(0, 0);
      display.println("Checking database...");
      display.println("Barcode: " + barcodeData);
      display.display();
      
      Product dbProduct = lookupProductInDatabase(barcodeData);
      
      if (dbProduct.foundInDatabase) {
        // Product found in database - show database info and benefits
        String productInfo = "DATABASE MATCH:\n";
        productInfo += "Name: " + dbProduct.name + "\n";
        productInfo += "Type: " + dbProduct.type + "\n";
        productInfo += "Price: " + dbProduct.price + "\n";
        productInfo += "Category: " + dbProduct.category + "\n";
        productInfo += "\nAnalyzing benefits\nwith AI model...";
        
        // Display database product information
        displayText(productInfo);
        delay(3000);
        
        // Get AI analysis for benefits
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(SH110X_WHITE);
        display.setCursor(0, 0);
        display.println("AI Analysis in progress...");
        display.println("Analyzing benefits for:");
        display.println(dbProduct.name);
        display.display();
        
        // Call AI model for benefits analysis
        String aiBenefits = callAIBenefitsAnalysis(barcodeData, dbProduct.name);
        
        // Display AI benefits
        String fullInfo = "PRODUCT FOUND:\n";
        fullInfo += "Name: " + dbProduct.name + "\n";
        fullInfo += "Type: " + dbProduct.type + "\n";
        fullInfo += "Price: " + dbProduct.price + "\n";
        fullInfo += "\nAI BENEFITS:\n" + aiBenefits;
        
        displayText(fullInfo);
        delay(8000);
        
        // Send to Robridge server with database product info
        if (robridgeConnected) {
          sendScanToRobridge(barcodeData, &dbProduct);
        }
      } else {
        // Product not found in database - use AI model for analysis
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(SH110X_WHITE);
        display.setCursor(0, 0);
        display.println("Not in database");
        display.println("Analyzing with AI...");
        display.println("Barcode: " + barcodeData);
        display.display();
        delay(2000);
        
        // Analyze with AI model
        Product aiProduct = analyzeProductWithAI(barcodeData);
        
        if (aiProduct.name.length() > 0) {
          // AI successfully analyzed the product
          String aiInfo = "AI ANALYSIS:\n";
          aiInfo += "Name: " + aiProduct.name + "\n";
          aiInfo += "Type: " + aiProduct.type + "\n";
          aiInfo += "Category: " + aiProduct.category + "\n";
          aiInfo += "\nDetails:\n" + aiProduct.details;
          
          displayText(aiInfo);
          delay(8000);
          
          // Send to Robridge server with AI product info
          if (robridgeConnected) {
            sendScanToRobridge(barcodeData, &aiProduct);
          }
        } else {
          // AI analysis failed
          display.clearDisplay();
          display.setTextSize(1);
          display.setTextColor(SH110X_WHITE);
          display.setCursor(0, 0);
          display.println("Unknown Product");
          display.println("Barcode: " + barcodeData);
          display.println("");
          display.println("Not found in database");
          display.println("AI analysis failed");
          display.display();
          delay(3000);
          
          // Send to Robridge server anyway
          if (robridgeConnected) {
            sendScanToRobridge(barcodeData, nullptr);
          }
        }
      }

      // Flush remaining data to stop repeat printing
      while (GM77.available()) {
        GM77.read();
      }
      
      // Return to status screen
      displayStatusScreen();
    }
  }
}
