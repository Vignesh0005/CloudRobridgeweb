/*
 * ESP32 Hugging Face Gradio Space Integration
 * 
 * This code integrates your ESP32 barcode scanner with a Hugging Face Gradio Space
 * for AI-powered product identification and analysis.
 * 
 * Features:
 * - WiFi auto-reconnect with debug logging
 * - Hugging Face Space API integration
 * - Product database fallback
 * - OLED display with product information
 * - Error handling and retry logic
 * 
 * Hardware Requirements:
 * - ESP32 board
 * - GM77 barcode scanner (UART2: GPIO16 RX, GPIO17 TX)
 * - SH1106 OLED display (I2C: 0x3C)
 * - WiFi connection
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- WiFi Configuration ---
const char* ssid = "Thin";
const char* password = "12345678";

// --- Hugging Face Space Configuration ---
const char* huggingface_url = "https://VV01-barcodefetching.hf.space/api/predict";
const char* huggingface_api_key = "YOUR_HF_API_KEY"; // Optional, for private spaces

// --- ESP32 Device Configuration ---
const String deviceId = "ESP32_HF_SCANNER_001";
const String deviceName = "ESP32-HuggingFace-Scanner";
const String firmwareVersion = "3.0.0";

// --- OLED Setup ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SH1106G display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// --- GM77 Barcode Scanner on Serial2 ---
HardwareSerial GM77(2); // UART2 on ESP32 (GPIO16 RX, GPIO17 TX)

// --- Status Variables ---
bool wifiConnected = false;
bool huggingfaceConnected = false;
String lastScannedCode = "";
unsigned long lastPingTime = 0;
unsigned long pingInterval = 30000; // Ping every 30 seconds
unsigned long scanCount = 0;

// --- WiFi Auto-Reconnect Variables ---
unsigned long lastWiFiCheck = 0;
unsigned long wifiCheckInterval = 5000; // Check WiFi every 5 seconds
unsigned long lastReconnectAttempt = 0;
unsigned long reconnectDelay = 1000;
unsigned long maxReconnectDelay = 30000;
int reconnectAttempts = 0;
int maxReconnectAttempts = 10;
bool wifiReconnectInProgress = false;
String lastWiFiStatus = "";
int wifiRSSI = 0;
unsigned long wifiConnectedTime = 0;

// --- Debug Functions ---
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
    reconnectDelay = 1000;
    wifiReconnectInProgress = false;
  } else {
    if (wifiConnected) {
      debugPrint("WiFi Connection Lost!");
      wifiConnected = false;
      huggingfaceConnected = false;
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
  
  if (WiFi.status() != WL_DISCONNECTED) {
    debugPrint("Disconnecting from WiFi...");
    WiFi.disconnect(true);
    delay(1000);
  }
  
  debugPrint("Attempting to connect to: " + String(ssid));
  WiFi.begin(ssid, password);
  
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
  
  if (wifiConnected) {
    debugPrint("WiFi Health Check - RSSI: " + String(WiFi.RSSI()) + " dBm, Uptime: " + String((millis() - wifiConnectedTime) / 1000) + "s");
  }
}

// --- Barcode Processing Functions ---
String cleanBarcode(String rawData) {
  debugPrint("Raw barcode data: '" + rawData + "'");
  debugPrint("Raw data length: " + String(rawData.length()));
  
  String cleaned = "";
  for (int i = 0; i < rawData.length(); i++) {
    char c = rawData[i];
    if (c >= '0' && c <= '9') {
      cleaned += c;
    }
  }
  
  debugPrint("Cleaned barcode: '" + cleaned + "'");
  debugPrint("Cleaned length: " + String(cleaned.length()));
  return cleaned;
}

// --- Hugging Face API Integration ---
String callHuggingFaceAPI(String barcodeData) {
  if (!wifiConnected) {
    return "WiFi not connected";
  }
  
  debugPrint("Calling Hugging Face API for barcode: " + barcodeData);
  
  HTTPClient http;
  http.begin(huggingface_url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-BarcodeScanner/3.0");
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["barcode"] = barcodeData;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  debugPrint("Sending request to: " + String(huggingface_url));
  debugPrint("Payload: " + jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    debugPrint("Hugging Face API Response Code: " + String(httpResponseCode));
    debugPrint("Response: " + response);
    
    http.end();
    
    // Parse JSON response
    DynamicJsonDocument responseDoc(2048);
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (error) {
      debugPrint("JSON parsing failed: " + String(error.c_str()));
      return "Error parsing API response";
    }
    
    if (responseDoc["success"]) {
      String productName = responseDoc["product"]["name"];
      String productType = responseDoc["product"]["type"];
      String productDetails = responseDoc["product"]["details"];
      bool foundInDB = responseDoc["found_in_database"];
      
      String result = "Product: " + productName + "\n";
      result += "Type: " + productType + "\n";
      result += "Details: " + productDetails + "\n";
      result += "Source: " + (foundInDB ? "Database" : "AI Analysis");
      
      huggingfaceConnected = true;
      return result;
    } else {
      return "API Error: " + responseDoc["error"].as<String>();
    }
  } else {
    debugPrint("HTTP Error: " + String(httpResponseCode));
    http.end();
    return "HTTP Error: " + String(httpResponseCode);
  }
}

// --- Display Functions ---
void displayText(String text, int startY = 0) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  
  int y = startY;
  int maxCharsPerLine = 20;
  int maxLines = (SCREEN_HEIGHT - startY) / 8;
  int currentLine = 0;
  
  String lines[8];
  int lineCount = 0;
  int lastIndex = 0;
  
  for (int i = 0; i <= text.length() && lineCount < 8; i++) {
    if (i == text.length() || text.charAt(i) == '\n') {
      lines[lineCount] = text.substring(lastIndex, i);
      lineCount++;
      lastIndex = i + 1;
    }
  }
  
  for (int line = 0; line < lineCount && currentLine < maxLines; line++) {
    String lineText = lines[line];
    
    while (lineText.length() > maxCharsPerLine && currentLine < maxLines) {
      String displayLine = lineText.substring(0, maxCharsPerLine);
      
      int breakPoint = displayLine.lastIndexOf(' ');
      if (breakPoint > maxCharsPerLine - 10) {
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
    
    if (lineText.length() > 0 && currentLine < maxLines) {
      display.setCursor(0, y);
      display.println(lineText);
      y += 8;
      currentLine++;
    }
  }
  
  display.display();
}

void displayStatusScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("HF Barcode Scanner");
  
  if (wifiConnected) {
    display.println("WiFi: Connected");
    display.println("RSSI: " + String(wifiRSSI) + " dBm");
    display.println("HF: " + String(huggingfaceConnected ? "Connected" : "Disconnected"));
  } else {
    display.println("WiFi: Disconnected");
    if (wifiReconnectInProgress) {
      display.println("Reconnecting...");
    } else {
      display.println("Attempts: " + String(reconnectAttempts));
    }
  }
  
  display.println("Scans: " + String(scanCount));
  display.println("Last: " + lastScannedCode);
  display.display();
}

void displayAIProcessing(String barcodeData) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println("AI Analysis...");
  display.println("");
  display.println("Processing barcode:");
  display.println(barcodeData);
  display.println("");
  display.println("Connecting to");
  display.println("Hugging Face...");
  display.display();
  delay(2000);
  
  String aiResponse = callHuggingFaceAPI(barcodeData);
  
  if (aiResponse.length() > 0 && aiResponse != "WiFi not connected" && !aiResponse.startsWith("HTTP Error")) {
    displayText("AI Analysis Result:\n\n" + aiResponse);
    delay(5000);
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SH110X_WHITE);
    display.setCursor(0, 0);
    display.println("AI Analysis Failed");
    display.println("=================");
    display.println("");
    display.println("Reason: " + aiResponse);
    display.display();
    delay(3000);
  }
}

void setup() {
  Serial.begin(9600);
  delay(1000);
  
  debugPrint("=== ESP32 Hugging Face Barcode Scanner ===");
  debugPrint("Firmware Version: " + String(firmwareVersion));
  debugPrint("Device ID: " + String(deviceId));
  debugPrint("Device Name: " + String(deviceName));

  // Init GM77 scanner
  debugPrint("Initializing GM77 barcode scanner...");
  GM77.begin(9600, SERIAL_8N1, 16, 17);
  debugPrint("GM77 scanner initialized on UART2");

  // Init OLED
  debugPrint("Initializing OLED display...");
  if (!display.begin(0x3C, true)) {
    debugPrint("ERROR: OLED init failed!");
    for (;;);
  }
  debugPrint("OLED display initialized successfully");

  // Initialize variables
  debugPrint("Initializing system variables...");
  lastWiFiCheck = 0;
  reconnectAttempts = 0;
  wifiReconnectInProgress = false;
  wifiConnected = false;
  huggingfaceConnected = false;
  
  // Connect to WiFi
  debugPrint("Starting WiFi connection...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  int maxAttempts = 20;
  
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    attempts++;
    
    if (attempts % 4 == 0) {
      debugPrint("Connection attempt " + String(attempts) + "/" + String(maxAttempts));
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    wifiConnectedTime = millis();
    wifiRSSI = WiFi.RSSI();
    
    debugPrint("WiFi Connection Successful!");
    debugPrint("IP Address: " + WiFi.localIP().toString());
    debugPrint("RSSI: " + String(wifiRSSI) + " dBm");
  } else {
    debugPrint("WiFi Connection Failed!");
    debugPrint("Status: " + getWiFiStatusString(WiFi.status()));
  }
  
  debugPrint("System initialization complete");
  displayStatusScreen();
  
  debugPrint("=== System Ready ===");
  debugPrint("Available commands: wifi_status, wifi_reconnect, wifi_scan, help");
}

void loop() {
  // Enhanced WiFi monitoring
  checkWiFiConnection();
  
  // Check for debug commands
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
  
  // Check for barcode scan
  if (GM77.available()) {
    String rawData = GM77.readStringUntil('\n');
    String barcodeData = cleanBarcode(rawData);

    if (barcodeData.length() > 0) {
      lastScannedCode = barcodeData;
      scanCount++;
      
      debugPrint("Barcode Scanned: " + barcodeData);
      
      // Show AI processing
      displayAIProcessing(barcodeData);
      
      // Flush remaining data
      while (GM77.available()) {
        GM77.read();
      }
      
      // Return to status screen
      displayStatusScreen();
    }
  }
}
