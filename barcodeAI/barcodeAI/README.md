# AI-Powered Barcode Scanner

An intelligent barcode scanner that uses Google's Gemini AI to provide detailed product information including company name, product name, product type, and benefits.

## Features

- 🎥 **Real-time barcode scanning** using webcam and OpenCV
- 🧠 **AI-powered product recognition** using Google Gemini API
- 💾 **Local caching** with SQLite database
- 📊 **Structured JSON responses** for consistent data format
- 🛡️ **Robust error handling** with fallback to "Unknown" values
- 🔄 **Continuous scanning** with option to quit

## Prerequisites

- Python 3.7+
- Webcam access
- Google Gemini API key

## Installation

1. **Clone or download the project files**

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Get your Google Gemini API key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

4. **Set up environment variable (recommended):**
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```
   
   Or the application will prompt you for it when you run it.

## Usage

1. **Run the application:**
   ```bash
   python barcode_scanner.py
   ```

2. **Scan a barcode:**
   - Point your webcam at a barcode
   - The application will automatically detect and process it
   - Press 'q' in the camera window to quit scanning

3. **View results:**
   - Product information will be displayed in the terminal
   - New products are automatically saved to the database

## How It Works

1. **Barcode Detection**: Uses OpenCV and pyzbar to detect barcodes from webcam feed
2. **Database Check**: First checks if the barcode exists in the local SQLite database
3. **AI Query**: If not found, queries Google Gemini API for product information
4. **Data Storage**: Saves new product information to the database for future use
5. **Result Display**: Shows formatted product information to the user

## Database Schema

The SQLite database contains a single table `products` with the following structure:

```sql
CREATE TABLE products (
    barcode TEXT PRIMARY KEY,
    company TEXT,
    product_name TEXT,
    product_type TEXT,
    benefits TEXT
);
```

## API Response Format

The Gemini API is prompted to return structured JSON in the following format:

```json
{
    "company": "Company Name",
    "product_name": "Product Name",
    "product_type": "Product Category/Type",
    "benefits": "Key benefits or features of the product"
}
```

## Error Handling

- **Camera issues**: Graceful fallback with error messages
- **API failures**: Returns "Unknown" for all fields if Gemini API fails
- **Database errors**: Continues operation with appropriate error messages
- **Invalid barcodes**: Handles cases where barcode cannot be decoded

## Controls

- **Camera Window**: Press 'q' to quit barcode scanning
- **Terminal**: Type 'quit' to exit the application
- **Keyboard Interrupt**: Ctrl+C to force exit

## File Structure

```
barcodeAI/
├── barcode_scanner.py    # Main application file
├── requirements.txt      # Python dependencies
├── README.md            # This file
└── products.db          # SQLite database (created automatically)
```

## Troubleshooting

### Common Issues

1. **"Could not open webcam"**
   - Ensure no other applications are using the camera
   - Check camera permissions
   - Try running with administrator privileges

2. **"GEMINI_API_KEY not found"**
   - Set the environment variable or enter the key when prompted
   - Ensure the API key is valid and has proper permissions

3. **"No barcode detected"**
   - Ensure good lighting
   - Hold barcode steady and at appropriate distance
   - Try different barcode formats

4. **Import errors**
   - Run `pip install -r requirements.txt` to install all dependencies
   - Ensure you're using Python 3.7 or higher

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

## License

This project is open source and available under the MIT License.
