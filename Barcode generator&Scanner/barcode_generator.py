import sqlite3
import qrcode
import barcode
from barcode.writer import ImageWriter
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
from datetime import datetime
import io
from PIL import Image

app = Flask(__name__)
CORS(app)

# Database setup
def init_database():
    """Initialize SQLite database with barcode and racks tables"""
    conn = sqlite3.connect('barcodes.db')
    cursor = conn.cursor()
    
    # Create barcodes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS barcodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode_id TEXT UNIQUE NOT NULL,
            barcode_data TEXT NOT NULL,
            barcode_type TEXT NOT NULL,
            source TEXT NOT NULL,
            product_name TEXT,
            product_id TEXT,
            price REAL,
            location_x REAL,
            location_y REAL,
            location_z REAL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            file_path TEXT,
            metadata TEXT
        )
    ''')
    
    # Create racks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS racks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rack_name TEXT UNIQUE NOT NULL,
            product_name TEXT NOT NULL,
            product_id TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def generate_barcode_id(barcode_type, product_id):
    """Generate unique barcode ID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_suffix = ''.join([str(ord(c) % 10) for c in product_id[:3]]) if product_id else '000'
    return f"{barcode_type.upper()}_{timestamp}_{random_suffix}"

def save_barcode_to_db(barcode_id, barcode_data, barcode_type, source, file_path, metadata=None):
    """Save barcode information to database"""
    conn = sqlite3.connect('barcodes.db')
    cursor = conn.cursor()
    
    # Debug logging
    print(f"DEBUG: metadata type: {type(metadata)}")
    print(f"DEBUG: metadata content: {metadata}")
    
    # Extract location and product info from metadata
    product_name = metadata.get('product_name') if metadata else None
    product_id = metadata.get('product_id') if metadata else None
    price = metadata.get('price') if metadata else None
    
    # Handle location - it can be a string or object
    location_str = metadata.get('location') if metadata else None
    location_x = None
    location_y = None
    location_z = None
    
    print(f"DEBUG: location_str type: {type(location_str)}")
    print(f"DEBUG: location_str content: {location_str}")
    
    if location_str:
        if isinstance(location_str, str):
            # Parse location string like "12.3,12,60" or "Warehouse A"
            try:
                # Check if it looks like coordinates
                if ',' in location_str and any(char.isdigit() for char in location_str):
                    coords = location_str.split(',')
                    if len(coords) >= 1:
                        location_x = float(coords[0].strip())
                    if len(coords) >= 2:
                        location_y = float(coords[1].strip())
                    if len(coords) >= 3:
                        location_z = float(coords[2].strip())
                    print(f"DEBUG: Parsed coordinates - x:{location_x}, y:{location_y}, z:{location_z}")
                else:
                    # It's a location name, not coordinates
                    print(f"DEBUG: Location is a name: {location_str}")
            except (ValueError, IndexError) as e:
                print(f"DEBUG: Error parsing location: {e}")
                # Don't fail, just continue with None values
                pass
        elif isinstance(location_str, dict):
            # Handle location as object
            location_x = location_str.get('x')
            location_y = location_str.get('y')
            location_z = location_str.get('z')
            print(f"DEBUG: Location is a dict - x:{location_x}, y:{location_y}, z:{location_z}")
        else:
            print(f"DEBUG: Unknown location type: {type(location_str)}")
    
    category = metadata.get('category') if metadata else None
    
    cursor.execute('''
        INSERT INTO barcodes (
            barcode_id, barcode_data, barcode_type, source, file_path, metadata,
            product_name, product_id, price, location_x, location_y, location_z, category
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        barcode_id, barcode_data, barcode_type, source, file_path, 
        json.dumps(metadata) if metadata else None,
        product_name, product_id, price, location_x, location_y, location_z, category
    ))
    
    conn.commit()
    conn.close()

def generate_qr_code(data, filename):
    """Generate QR code"""
    print(f"DEBUG: Generating QR code with data: '{data}'")
    print(f"DEBUG: Data type: {type(data)}")
    print(f"DEBUG: Data length: {len(data) if data else 0}")
    print(f"DEBUG: Filename: {filename}")
    
    if not data or data.strip() == '':
        print("ERROR: Empty data provided for QR code generation")
        raise ValueError("Empty data provided for QR code generation")
    
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # Save the image
        full_path = f"{filename}.png"
        print(f"DEBUG: Saving QR code to: {full_path}")
        img.save(full_path)
        
        # Verify the file was created
        if os.path.exists(full_path):
            file_size = os.path.getsize(full_path)
            print(f"DEBUG: QR code saved successfully. File size: {file_size} bytes")
        else:
            print(f"ERROR: File was not created: {full_path}")
            raise FileNotFoundError(f"Failed to create file: {full_path}")
            
        return f"{filename}.png"
    except Exception as e:
        print(f"ERROR: Failed to generate QR code: {e}")
        raise e

def generate_1d_barcode(data, barcode_type, filename):
    """Generate 1D barcode (Code128, EAN13, etc.)"""
    print(f"DEBUG: Generating 1D barcode with data: '{data}'")
    print(f"DEBUG: Barcode type: {barcode_type}")
    print(f"DEBUG: Data type: {type(data)}")
    print(f"DEBUG: Data length: {len(data) if data else 0}")
    
    if not data or data.strip() == '':
        print("ERROR: Empty data provided for 1D barcode generation")
        raise ValueError("Empty data provided for 1D barcode generation")
    
    try:
        barcode_class = barcode.get_barcode_class(barcode_type)
        barcode_instance = barcode_class(data, writer=ImageWriter())
        # The ImageWriter automatically adds .png extension
        barcode_instance.save(filename)
        print(f"DEBUG: 1D barcode saved to: {filename}.png")
        # Return the filename with .png extension
        return f"{filename}.png"
    except Exception as e:
        print(f"DEBUG: Error generating {barcode_type}: {e}")
        # Fallback to Code128 if the specified type fails
        if barcode_type != 'code128':
            print(f"Warning: {barcode_type} failed, falling back to Code128")
            barcode_class = barcode.get_barcode_class('code128')
            barcode_instance = barcode_class(data, writer=ImageWriter())
            barcode_instance.save(filename)
            print(f"DEBUG: Fallback Code128 barcode saved to: {filename}.png")
            return f"{filename}.png"
        else:
            raise e

@app.route('/generate_barcode', methods=['POST'])
def generate_barcode():
    """API endpoint to generate barcode"""
    try:
        data = request.get_json()
        
        # Debug logging
        print(f"DEBUG: Received data: {data}")
        print(f"DEBUG: Data type: {type(data)}")
        
        # Extract parameters
        barcode_data = data.get('data')
        barcode_type = data.get('type', 'qr')  # qr, code128, ean13, etc.
        source = data.get('source', 'web')  # web, mobile
        metadata = data.get('metadata', {})
        
        print(f"DEBUG: barcode_data: {barcode_data}")
        print(f"DEBUG: barcode_type: {barcode_type}")
        print(f"DEBUG: source: {source}")
        print(f"DEBUG: metadata: {metadata}")
        print(f"DEBUG: metadata type: {type(metadata)}")
        
        if not barcode_data:
            return jsonify({'error': 'Barcode data is required'}), 400
        
        # Create barcodes directory if it doesn't exist
        os.makedirs('barcodes', exist_ok=True)
        print(f"DEBUG: Created barcodes directory")
        
        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"barcodes/{barcode_type}_{timestamp}"
        print(f"DEBUG: Generated filename: {filename}")
        
        # Generate barcode based on type
        print(f"DEBUG: Starting barcode generation for type: {barcode_type}")
        if barcode_type.lower() == 'qr':
            print(f"DEBUG: Calling generate_qr_code")
            # For QR codes, create comprehensive data structure with all metadata
            if metadata and len(metadata) > 0:
                # Create a comprehensive data structure for QR codes
                qr_data = {
                    "product_name": metadata.get('product_name', barcode_data),
                    "product_id": metadata.get('product_id', 'N/A'),
                    "price": metadata.get('price', 'N/A'),
                    "location": metadata.get('location', 'N/A'),
                    "category": metadata.get('category', 'N/A'),
                    "timestamp": datetime.now().isoformat(),
                    "source": source
                }
                # Convert to JSON string for QR code
                qr_data_string = json.dumps(qr_data, indent=2)
                print(f"DEBUG: QR code data structure: {qr_data_string}")
                final_filename = generate_qr_code(qr_data_string, filename)
            else:
                # Fallback to original data if no metadata
                final_filename = generate_qr_code(barcode_data, filename)
            print(f"DEBUG: QR code generation returned: {final_filename}")
        else:
            print(f"DEBUG: Calling generate_1d_barcode")
            final_filename = generate_1d_barcode(barcode_data, barcode_type, filename)
            print(f"DEBUG: 1D barcode generation returned: {final_filename}")
        
        # Verify file was created
        if not os.path.exists(final_filename):
            print(f"ERROR: File was not created: {final_filename}")
            return jsonify({'error': f'Failed to create barcode file: {final_filename}'}), 500
        
        print(f"DEBUG: File exists: {final_filename}")
        
        # Generate unique barcode ID
        product_id_from_metadata = metadata.get('product_id', 'UNKNOWN') if metadata else 'UNKNOWN'
        barcode_id = generate_barcode_id(barcode_type, product_id_from_metadata)
        print(f"DEBUG: Generated barcode ID: {barcode_id}")
        
        # Save to database with the final filename (including .png extension)
        print(f"DEBUG: Saving to database")
        save_barcode_to_db(barcode_id, barcode_data, barcode_type, source, final_filename, metadata)
        print(f"DEBUG: Saved to database successfully")
        
        # Return just the filename without the path for the frontend
        filename_only = os.path.basename(final_filename)
        
        return jsonify({
            'success': True,
            'message': f'{barcode_type.upper()} barcode generated successfully',
            'barcode_id': barcode_id,
            'filename': filename_only,
            'data': barcode_data,
            'type': barcode_type,
            'source': source
        })
        
    except Exception as e:
        print(f"ERROR: Exception in generate_barcode: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/get_barcode/<filename>')
def get_barcode(filename):
    """Serve generated barcode image"""
    try:
        print(f"DEBUG: Requesting barcode file: {filename}")
        
        # Handle both full path and just filename
        if filename.startswith('barcodes/'):
            file_path = filename
        else:
            file_path = os.path.join('barcodes', filename)
            
        print(f"DEBUG: Full file path: {file_path}")
        print(f"DEBUG: File exists: {os.path.exists(file_path)}")
        
        if os.path.exists(file_path):
            print(f"DEBUG: Serving file: {file_path}")
            return send_file(file_path, mimetype='image/png')
        else:
            print(f"DEBUG: File not found: {file_path}")
            # List files in barcodes directory for debugging
            if os.path.exists('barcodes'):
                files = os.listdir('barcodes')
                print(f"DEBUG: Files in barcodes directory: {files}")
            else:
                print(f"DEBUG: barcodes directory does not exist")
            return jsonify({'error': 'Barcode not found'}), 404
    except Exception as e:
        print(f"DEBUG: Error serving file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/list_barcodes')
def list_barcodes():
    """List all generated barcodes"""
    try:
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, barcode_id, barcode_data, barcode_type, source, created_at, file_path, metadata,
                   product_name, product_id, price, location_x, location_y, location_z, category
            FROM barcodes
            ORDER BY created_at DESC
        ''')
        
        barcodes = []
        for row in cursor.fetchall():
            barcodes.append({
                'id': row[0],
                'barcode_id': row[1],
                'data': row[2],
                'type': row[3],
                'source': row[4],
                'created_at': row[5],
                'file_path': row[6],
                'metadata': json.loads(row[7]) if row[7] else None,
                'product_name': row[8],
                'product_id': row[9],
                'price': row[10],
                'location_x': row[11],
                'location_y': row[12],
                'location_z': row[13],
                'category': row[14]
            })
        
        conn.close()
        return jsonify({'barcodes': barcodes})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_barcode_by_id/<barcode_id>')
def get_barcode_by_id(barcode_id):
    """Get barcode details by barcode ID"""
    try:
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, barcode_id, barcode_data, barcode_type, source, created_at, file_path, metadata,
                   product_name, product_id, price, location_x, location_y, location_z, category
            FROM barcodes
            WHERE barcode_id = ?
        ''', (barcode_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            barcode = {
                'id': row[0],
                'barcode_id': row[1],
                'data': row[2],
                'type': row[3],
                'source': row[4],
                'created_at': row[5],
                'file_path': row[6],
                'metadata': json.loads(row[7]) if row[7] else None,
                'product_name': row[8],
                'product_id': row[9],
                'price': row[10],
                'location_x': row[11],
                'location_y': row[12],
                'location_z': row[13],
                'category': row[14]
            }
            return jsonify(barcode)
        else:
            return jsonify({'error': 'Barcode not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_barcode_data/<barcode_id>')
def get_barcode_data(barcode_id):
    """Get structured barcode data by ID"""
    try:
        print(f"DEBUG: Requesting barcode data for ID: {barcode_id}")
        
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT barcode_data, barcode_type, metadata, created_at, source
            FROM barcodes 
            WHERE barcode_id = ?
        ''', (barcode_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            barcode_data, barcode_type, metadata, created_at, source = result
            return jsonify({
                'success': True,
                'barcode_id': barcode_id,
                'data': barcode_data,
                'type': barcode_type,
                'metadata': json.loads(metadata) if metadata else {},
                'created_at': created_at,
                'source': source
            })
        else:
            return jsonify({'error': 'Barcode not found'}), 404
            
    except Exception as e:
        print(f"ERROR: Exception in get_barcode_data: {e}")
        return jsonify({'error': str(e)}), 500

# Rack Management API Endpoints
@app.route('/api/racks', methods=['GET'])
def get_racks():
    """Get all racks with optional search and filter"""
    try:
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        # Get query parameters
        search = request.args.get('search', '')
        status = request.args.get('status', 'all')
        
        # Build query
        query = '''
            SELECT id, rack_name, product_name, product_id, status, created_at, updated_at
            FROM racks
        '''
        params = []
        conditions = []
        
        if search:
            conditions.append('(rack_name LIKE ? OR product_name LIKE ? OR product_id LIKE ?)')
            search_term = f'%{search}%'
            params.extend([search_term, search_term, search_term])
        
        if status != 'all':
            conditions.append('status = ?')
            params.append(status)
        
        if conditions:
            query += ' WHERE ' + ' AND '.join(conditions)
        
        query += ' ORDER BY created_at DESC'
        
        cursor.execute(query, params)
        racks = []
        for row in cursor.fetchall():
            racks.append({
                'id': row[0],
                'rackName': row[1],
                'productName': row[2],
                'productId': row[3],
                'status': row[4],
                'createdAt': row[5],
                'updatedAt': row[6]
            })
        
        conn.close()
        return jsonify({'success': True, 'racks': racks})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/racks', methods=['POST'])
def create_rack():
    """Create a new rack"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('rackName') or not data.get('productName') or not data.get('productId'):
            return jsonify({'success': False, 'error': 'Rack name, product name, and product ID are required'}), 400
        
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        # Check if rack name already exists
        cursor.execute('SELECT id FROM racks WHERE rack_name = ?', (data['rackName'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Rack name already exists'}), 400
        
        # Insert new rack
        cursor.execute('''
            INSERT INTO racks (rack_name, product_name, product_id, status)
            VALUES (?, ?, ?, ?)
        ''', (
            data['rackName'],
            data['productName'],
            data['productId'],
            data.get('status', 'active')
        ))
        
        rack_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Rack created successfully',
            'rack': {
                'id': rack_id,
                'rackName': data['rackName'],
                'productName': data['productName'],
                'productId': data['productId'],
                'status': data.get('status', 'active')
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/racks/<int:rack_id>', methods=['PUT'])
def update_rack(rack_id):
    """Update an existing rack"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('rackName') or not data.get('productName') or not data.get('productId'):
            return jsonify({'success': False, 'error': 'Rack name, product name, and product ID are required'}), 400
        
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        # Check if rack exists
        cursor.execute('SELECT id FROM racks WHERE id = ?', (rack_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Rack not found'}), 404
        
        # Check if rack name already exists (excluding current rack)
        cursor.execute('SELECT id FROM racks WHERE rack_name = ? AND id != ?', (data['rackName'], rack_id))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Rack name already exists'}), 400
        
        # Update rack
        cursor.execute('''
            UPDATE racks 
            SET rack_name = ?, product_name = ?, product_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data['rackName'],
            data['productName'],
            data['productId'],
            data.get('status', 'active'),
            rack_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Rack updated successfully',
            'rack': {
                'id': rack_id,
                'rackName': data['rackName'],
                'productName': data['productName'],
                'productId': data['productId'],
                'status': data.get('status', 'active')
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/racks/<int:rack_id>', methods=['DELETE'])
def delete_rack(rack_id):
    """Delete a rack"""
    try:
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        # Check if rack exists
        cursor.execute('SELECT id FROM racks WHERE id = ?', (rack_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Rack not found'}), 404
        
        # Delete rack
        cursor.execute('DELETE FROM racks WHERE id = ?', (rack_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Rack deleted successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/racks/stats', methods=['GET'])
def get_rack_stats():
    """Get rack statistics"""
    try:
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        # Get total racks
        cursor.execute('SELECT COUNT(*) FROM racks')
        total_racks = cursor.fetchone()[0]
        
        # Get active racks
        cursor.execute('SELECT COUNT(*) FROM racks WHERE status = "active"')
        active_racks = cursor.fetchone()[0]
        
        # Get inactive racks
        cursor.execute('SELECT COUNT(*) FROM racks WHERE status = "inactive"')
        inactive_racks = cursor.fetchone()[0]
        
        # Get unique products
        cursor.execute('SELECT COUNT(DISTINCT product_id) FROM racks')
        unique_products = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'totalRacks': total_racks,
                'activeRacks': active_racks,
                'inactiveRacks': inactive_racks,
                'uniqueProducts': unique_products
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/racks/search', methods=['GET'])
def search_racks():
    """Search racks by rack ID or rack name"""
    try:
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({'success': False, 'error': 'Search query is required'}), 400
        
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        # Search by rack ID (exact match) or rack name (partial match)
        cursor.execute('''
            SELECT id, rack_name, product_name, product_id, status, created_at, updated_at
            FROM racks
            WHERE id = ? OR rack_name LIKE ?
            ORDER BY 
                CASE 
                    WHEN id = ? THEN 1
                    WHEN rack_name = ? THEN 2
                    ELSE 3
                END,
                created_at DESC
        ''', (query, f'%{query}%', query, query))
        
        racks = []
        for row in cursor.fetchall():
            racks.append({
                'id': row[0],
                'rackName': row[1],
                'productName': row[2],
                'productId': row[3],
                'status': row[4],
                'createdAt': row[5],
                'updatedAt': row[6]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'racks': racks,
            'query': query,
            'count': len(racks)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/rack-status', methods=['GET'])
def get_rack_status():
    """Get rack status for operational monitoring"""
    try:
        conn = sqlite3.connect('barcodes.db')
        cursor = conn.cursor()
        
        # Get all racks with their operational status
        cursor.execute('''
            SELECT 
                id,
                rack_name,
                product_name,
                product_id,
                status,
                created_at,
                updated_at
            FROM racks 
            ORDER BY rack_name
        ''')
        
        racks = []
        for row in cursor.fetchall():
            # Determine operational status based on management data
            operational_status = 'free'  # Default
            occupied_by = None
            
            if row[4] == 'active':  # If rack is active in management
                if row[2] and row[2].strip():  # If product is assigned
                    operational_status = 'occupied'
                    occupied_by = f"Product-{row[3]}"  # Use product ID as identifier
                else:
                    operational_status = 'free'
            else:  # If rack is inactive in management
                operational_status = 'maintenance'
            
            # Generate mock environmental data (in real system, this would come from sensors)
            import random
            base_temp = 22.0
            base_humidity = 45
            
            rack_data = {
                'id': row[0],
                'name': row[1],
                'location': f'Warehouse Section {chr(65 + (row[0] - 1) // 2)}',  # A, B, C sections
                'coordinates': {
                    'x': 10 + ((row[0] - 1) % 2) * 15,  # Alternate positions
                    'y': 15 + ((row[0] - 1) // 2) * 20   # Row spacing
                },
                'status': operational_status,
                'occupiedBy': occupied_by,
                'lastUpdated': row[6] or row[5],  # Use updated_at or created_at
                'capacity': 100,
                'currentLoad': 85 if operational_status == 'occupied' else 0,
                'temperature': round(base_temp + random.uniform(-2, 2), 1),
                'humidity': round(base_humidity + random.uniform(-5, 5)),
                'productName': row[2] if row[2] else 'No Product',
                'productId': row[3] if row[3] else 'N/A'
            }
            racks.append(rack_data)
        
        conn.close()
        
        # Calculate statistics
        total_racks = len(racks)
        occupied_racks = len([r for r in racks if r['status'] == 'occupied'])
        free_racks = len([r for r in racks if r['status'] == 'free'])
        maintenance_racks = len([r for r in racks if r['status'] == 'maintenance'])
        utilization = round((occupied_racks / total_racks * 100) if total_racks > 0 else 0)
        
        return jsonify({
            'success': True,
            'racks': racks,
            'stats': {
                'total': total_racks,
                'occupied': occupied_racks,
                'free': free_racks,
                'maintenance': maintenance_racks,
                'utilization': utilization
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/init-db', methods=['POST'])
def init_database_endpoint():
    """Initialize database endpoint"""
    try:
        init_database()
        return jsonify({
            'success': True,
            'message': 'Database initialized successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Barcode generator is running'})

if __name__ == '__main__':
    # Initialize database
    print("Initializing database...")
    init_database()
    print("Database initialized successfully!")
    
    print("Barcode Generator Server Starting...")
    print("Available endpoints:")
    print("- POST /generate_barcode - Generate new barcode")
    print("- GET /get_barcode/<filename> - Get barcode image")
    print("- GET /get_barcode_by_id/<barcode_id> - Get barcode details by ID")
    print("- GET /get_barcode_data/<barcode_id> - Get structured barcode data")
    print("- GET /list_barcodes - List all barcodes")
    print("- GET /api/racks - Rack management endpoints")
    print("- GET /api/racks/stats - Rack statistics")
    print("- GET /api/racks/search - Search racks")
    print("- GET /health - Health check")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
