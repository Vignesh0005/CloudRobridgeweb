from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
import uvicorn
import re
import os
import logging
import aiohttp
from fastapi.middleware.cors import CORSMiddleware

# ======================
# CONFIGURATION - Using Environment Variables
# ======================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

client = OpenAI(api_key=OPENAI_API_KEY)

# Server configuration
PORT = int(os.getenv("PORT", os.getenv("AI_SERVER_PORT", "8000")))
HOST = os.getenv("AI_SERVER_HOST", "0.0.0.0")

# CORS configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(title="Robridge AI Scanner", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log configuration (without exposing full API key)
logger.info(f"Using OpenAI API Key: {OPENAI_API_KEY[:20]}...")
logger.info(f"Server will run on {HOST}:{PORT}")
logger.info(f"CORS enabled for: {ALLOWED_ORIGINS}")

# ======================
# Pydantic Models
# ======================
class ScanInput(BaseModel):
    scanned_value: str

class ESP32ScanInput(BaseModel):
    deviceId: str
    barcodeData: str
    deviceName: str = None
    scanType: str = None
    timestamp: int = None

class AIAnalysisResponse(BaseModel):
    success: bool
    title: str
    category: str
    description: str
    description_short: str = None  # For ESP32 display (138 char limit)
    country: str = "Unknown"
    barcode: str
    deviceId: str

# ======================
# COUNTRY CODE MAPPING (EAN Prefixes)
# ======================
COUNTRY_CODES = {
    "890": "India",
    "000": "United States",
    "001": "United States",
    "002": "United States",
    "003": "United States",
    "004": "United States",
    "005": "United States",
    "030": "France",
    "380": "Bulgaria",
    "400": "Germany",
    "450": "Japan",
    "460": "Russia",
    "500": "United Kingdom",
    "539": "Ireland",
    "560": "Portugal",
    "590": "Poland",
    "600": "South Africa",
    "690": "China",
    "700": "Norway",
    "729": "Israel",
    "740": "Guatemala",
    "750": "Mexico",
    "780": "Chile",
    "789": "Brazil",
    "810": "Italy",
    "840": "Spain",
    "869": "Turkey",
    "880": "South Korea",
    "885": "Thailand",
    "890": "India",
    "893": "Vietnam",
    "899": "Indonesia",
}

# ======================
# Helper Functions
# ======================
def get_country_from_barcode(barcode: str) -> str:
    prefix = barcode[:3]
    return COUNTRY_CODES.get(prefix, "Unknown Country")

async def fetch_product_info(barcode: str) -> dict:
    """
    Fetch product information from multiple barcode databases
    """
    product_info = {
        "found": False,
        "product_name": None,
        "brand": None,
        "category": None,
        "description": None,
        "image_url": None
    }
    
    # Try Open Food Facts API (great for food products)
    try:
        async with aiohttp.ClientSession() as session:
            url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == 1:
                        product = data.get("product", {})
                        product_info["found"] = True
                        product_info["product_name"] = product.get("product_name") or product.get("product_name_en")
                        product_info["brand"] = product.get("brands")
                        product_info["category"] = product.get("categories")
                        product_info["description"] = product.get("generic_name") or product.get("ingredients_text")
                        product_info["image_url"] = product.get("image_url")
                        return product_info
    except Exception as e:
        logger.error(f"Open Food Facts API error: {e}")
    
    # Try UPCitemdb API (general products) - use API key if provided
    try:
        upc_api_key = os.getenv("UPC_ITEM_DB_API_KEY")
        async with aiohttp.ClientSession() as session:
            if upc_api_key:
                url = f"https://api.upcitemdb.com/prod/lookup?upc={barcode}"
                headers = {"Authorization": f"Bearer {upc_api_key}"}
            else:
                url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"
                headers = {}
            
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("code") == "OK" and data.get("items"):
                        item = data["items"][0]
                        product_info["found"] = True
                        product_info["product_name"] = item.get("title")
                        product_info["brand"] = item.get("brand")
                        product_info["category"] = item.get("category")
                        product_info["description"] = item.get("description")
                        product_info["image_url"] = item.get("images", [None])[0] if item.get("images") else None
                        return product_info
    except Exception as e:
        logger.error(f"UPCitemdb API error: {e}")
    
    return product_info

def generate_barcode_info(barcode: str):
    """
    Generate local explanation for a 1D barcode.
    """
    country = get_country_from_barcode(barcode)
    return f"""
Scanned Code: {barcode}
Title: 1D Barcode
Category: {country} Barcode
Description: A 1D barcode, also known as a linear barcode, is a machine-readable code that represents product information using parallel lines of varying widths. 
It is commonly printed on product packaging and used globally for inventory tracking, retail scanning, and supply chain management. 
Each 1D barcode encodes numeric or alphanumeric data, which is read by optical scanners or cameras. 
These codes help automate the checkout process, manage product identification, and maintain efficient logistics systems. 
The first few digits in this barcode identify the country and company prefix, linking it to registered manufacturers and distributors.
""".strip()

def generate_qr_info(url: str):
    """
    Generates detailed 5-6 sentence summary about the QR link using OpenAI.
    """
    prompt = f"""
    The scanned QR code contains this link: {url}.
    Identify what it represents — e.g., an organization, person, or brand.
    Return output in the exact format:

    Scanned Code: {url}
    Title: <Name or Brand>
    Category: <Type - Website, Person, Organization, Social Media>
    Description: <Write 5–6 factual and descriptive sentences about the entity, 
    its purpose, reputation, and what a visitor would find or do on that link.>
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You describe QR links accurately and consistently without extra commentary."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content.strip()

# ======================
# Endpoints
# ======================
@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "Robridge AI Scanner", 
        "version": "2.0.0",
        "environment": os.getenv("NODE_ENV", "development")
    }

@app.post("/test-esp32")
async def test_esp32(data: dict):
    logger.info(f"Test ESP32 received: {data}")
    return {"success": True, "received": data}

@app.post("/api/esp32/ping/{device_id}")
async def esp32_ping(device_id: str):
    """ESP32 heartbeat/ping endpoint"""
    logger.info(f"ESP32 ping received from {device_id}")
    return {"status": "ok", "deviceId": device_id, "timestamp": "pong"}

@app.get("/api/esp32/ping/{device_id}")
async def esp32_ping_get(device_id: str):
    """ESP32 heartbeat/ping endpoint (GET)"""
    logger.info(f"ESP32 ping GET received from {device_id}")
    return {"status": "ok", "deviceId": device_id, "timestamp": "pong"}

@app.post("/api/esp32/scan")
async def esp32_scan(data: ESP32ScanInput):
    try:
        logger.info(f"ESP32 scan received from {data.deviceId}: {data.barcodeData}")
        logger.info(f"Additional data - deviceName: {data.deviceName}, scanType: {data.scanType}, timestamp: {data.timestamp}")
        
        # Case 1: Numeric barcode
        if re.fullmatch(r"\d{8,14}", data.barcodeData):
            country = get_country_from_barcode(data.barcodeData)
            logger.info(f"Processing numeric barcode from {country}")
            
            # Fetch product information from database
            product_info = await fetch_product_info(data.barcodeData)
            
            # Enhanced barcode description based on country
            prefix = data.barcodeData[:3]
            barcode_length = len(data.barcodeData)
            
            if barcode_length == 13:
                barcode_type = "EAN-13 (European Article Number)"
            elif barcode_length == 12:
                barcode_type = "UPC-A (Universal Product Code)"
            elif barcode_length == 8:
                barcode_type = "EAN-8"
            else:
                barcode_type = "Standard Product Barcode"
            
            # Build description based on whether product was found
            if product_info["found"]:
                # Product found in database
                product_name = product_info["product_name"] or "Unknown Product"
                brand = product_info["brand"] or "Unknown Brand"
                category = product_info["category"] or "General Product"
                
                title = f"{product_name}"
                
                # Full description for website (plain text, no markdown or emojis)
                description = f"Product Identified: {product_name}\n\n"
                description += f"Brand: {brand}\n"
                description += f"Category: {category}\n"
                description += f"Origin: {country} (Barcode prefix: {prefix})\n"
                description += f"Barcode Type: {barcode_type}\n\n"
                
                if product_info["description"]:
                    description += f"Details: {product_info['description'][:200]}...\n\n"
                
                description += f"This product is registered in international product databases and is used for retail identification and inventory management. "
                description += f"The barcode encodes manufacturer identification, product code, and validation information. "
                
                # Short description for ESP32 display (138 char limit)
                description_short = f"{product_name} by {brand}. Category: {category}. Origin: {country}. Type: {barcode_type}."
                if len(description_short) > 138:
                    description_short = description_short[:135] + "..."
                
                logger.info(f"Product found: {product_name} by {brand}")
                
            else:
                # Product not found in database
                title = f"Product Barcode - {country}"
                
                # Full description for website
                description = f"Product Lookup: No product information found in public databases for this barcode.\n\n"
                description += f"Barcode Type: {barcode_type}\n"
                description += f"Country of Origin: {country} (prefix: {prefix})\n\n"
                description += f"This barcode is commonly used for retail product identification and inventory management. "
                
                # Short description for ESP32 display (138 char limit)
                description_short = f"Product not found. Type: {barcode_type}. Origin: {country} (prefix {prefix})."
                if len(description_short) > 138:
                    description_short = description_short[:135] + "..."
                
                logger.info(f"Product not found in databases for barcode: {data.barcodeData}")
            
            return AIAnalysisResponse(
                success=True,
                title=title,
                category=f"{country} Product",
                description=description,
                description_short=description_short,
                country=country,
                barcode=data.barcodeData,
                deviceId=data.deviceId
            )
        
        # Case 2: QR code / URL - Similar handling as before
        # ... (rest of the code from original server.py)
        
    except Exception as e:
        logger.error(f"AI analysis error: {e}", exc_info=True)
        return AIAnalysisResponse(
            success=True,
            title="Unknown",
            category="Uncategorized",
            description="AI analysis temporarily unavailable.",
            description_short="Analysis error.",
            country="Unknown",
            barcode=data.barcodeData,
            deviceId=data.deviceId
        )

# ======================
# Run Server
# ======================
if __name__ == "__main__":
    print("=" * 60)
    print("🤖 Robridge AI Analysis Server Starting (Railway Version)")
    print("=" * 60)
    print(f"📡 Server will run on: http://{HOST}:{PORT}")
    print(f"🔍 Health check: http://localhost:{PORT}/health")
    print(f"🌍 Environment: {os.getenv('NODE_ENV', 'development')}")
    print("=" * 60)
    
    uvicorn.run("server-railway:app", host=HOST, port=PORT, reload=False)

