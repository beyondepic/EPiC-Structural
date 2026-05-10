"""
Production-ready Flask API server for regression data retrieval
Features:
- AES-256-GCM encryption for data transmission
- Environment-based configuration
- JWT authentication with secure token management
- Production-ready security measures
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import psycopg2
import psycopg2.extras
import json
from datetime import datetime, timedelta
import bcrypt
import base64
import hashlib
import os
import json
import importlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# CORS Configuration - use environment variable for production
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, origins=cors_origins)

# JWT Configuration from environment variables
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600)))
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(seconds=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 2592000)))

# Encryption Configuration - Production Ready
import os
import secrets
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Environment variables for production security
ENCRYPTION_PASSWORD_ENV = os.environ.get('ENCRYPTION_PASSWORD')
ENCRYPTION_MASTER_KEY = os.environ.get('ENCRYPTION_MASTER_KEY')

# Session-level encryption password (generated if not supplied via env)
if ENCRYPTION_PASSWORD_ENV:
    SESSION_ENCRYPTION_PASSWORD = ENCRYPTION_PASSWORD_ENV.encode('utf-8')
else:
    # Generate a session-only password (32 bytes) if env var not provided
    SESSION_ENCRYPTION_PASSWORD = secrets.token_bytes(32)
    print("Warning: ENCRYPTION_PASSWORD not set. Using session-generated encryption password. For persistent keys set ENCRYPTION_PASSWORD in the environment.")

# Generate or load master key for production
if ENCRYPTION_MASTER_KEY:
    MASTER_KEY = ENCRYPTION_MASTER_KEY.encode('utf-8')
else:
    # Generate a secure master key for this session (should be persistent in production)
    MASTER_KEY = secrets.token_bytes(32)
    print("Warning: Using session-generated master key. Set ENCRYPTION_MASTER_KEY environment variable for production.")

jwt = JWTManager(app)

class DataEncryption:
    """Production-ready class to handle AES-GCM encryption and decryption"""
    
    @staticmethod
    def _derive_key(password=None, salt=None):
        """Derive a key using PBKDF2 with random salt"""
        # password may be provided explicitly (bytes) or use session-level password
        if password is None:
            password = SESSION_ENCRYPTION_PASSWORD
        if salt is None:
            salt = secrets.token_bytes(16)  # Generate random salt
            
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256-bit key
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(password)
        return key, salt
    
    @staticmethod
    def encrypt_data(data):
        """Encrypt data using AES-GCM (production-ready)"""
        try:
            # Convert data to JSON string
            json_data = json.dumps(data)
            data_bytes = json_data.encode('utf-8')
            
            # Generate random salt and derive key
            key, salt = DataEncryption._derive_key()
            
            # Generate random IV (96 bits for GCM)
            iv = secrets.token_bytes(12)
            
            # Create cipher
            cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
            encryptor = cipher.encryptor()
            
            # Encrypt data
            ciphertext = encryptor.update(data_bytes) + encryptor.finalize()
            
            # Combine salt + iv + tag + ciphertext
            encrypted_package = salt + iv + encryptor.tag + ciphertext
            
            # Base64 encode for JSON transmission
            encoded_data = base64.b64encode(encrypted_package).decode('utf-8')
            
            return encoded_data
        except Exception as e:
            print(f"Encryption error: {e}")
            return None
    
    @staticmethod
    def decrypt_data(encrypted_data):
        """Decrypt data using AES-GCM"""
        try:
            # Decode base64
            encrypted_package = base64.b64decode(encrypted_data.encode('utf-8'))
            
            # Extract components
            salt = encrypted_package[:16]       # First 16 bytes: salt
            iv = encrypted_package[16:28]       # Next 12 bytes: IV
            tag = encrypted_package[28:44]      # Next 16 bytes: authentication tag
            ciphertext = encrypted_package[44:] # Remaining: ciphertext
            
            # Derive key from salt
            key, _ = DataEncryption._derive_key(salt=salt)
            
            # Create cipher and decrypt
            cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag))
            decryptor = cipher.decryptor()
            
            # Decrypt and verify
            decrypted_bytes = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Convert back to Python object
            json_data = decrypted_bytes.decode('utf-8')
            return json.loads(json_data)
        except Exception as e:
            print(f"Decryption error: {e}")
            return None

def create_encrypted_response(data, success=True, message=None):
    """Create an encrypted API response"""
    response_data = {
        'success': success,
        'message': message,
        'data': data
    }
    
    encrypted_data = DataEncryption.encrypt_data(response_data)
    
    if encrypted_data is None:
        # Fallback to unencrypted response in case of encryption failure
        return jsonify({
            'success': False,
            'error': 'Data encryption failed',
            'encrypted': False
        }), 500
    
    return jsonify({
        'encrypted': True,
        'data': encrypted_data
    })

# Mock user database (In production, use a real database)
USERS = {
    'admin': {
        'username': 'admin',
        'password_hash': bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()),
        'role': 'admin'
    },
    'user': {
        'username': 'user', 
        'password_hash': bcrypt.hashpw('user123'.encode('utf-8'), bcrypt.gensalt()),
        'role': 'user'
    }
}

# Database connection configuration from environment variables
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'database': os.environ.get('DB_NAME', 'postgres'),
    'user': os.environ.get('DB_USER', 'xyt'),
    'password': os.environ.get('DB_PASSWORD', '19711221'),
    'port': os.environ.get('DB_PORT', '5432')
}
def get_db_connection():
    """Get the database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Flask regression API server is running'})

@app.route('/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()
    
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password required'}), 400
    
    username = data['username']
    password = data['password']
    
    # Check if user exists
    if username not in USERS:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    user = USERS[username]
    
    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create tokens
    access_token = create_access_token(identity=username)
    refresh_token = create_refresh_token(identity=username)
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'username': user['username'],
            'role': user['role']
        }
    })


# ...existing auth/login response above...

@app.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Token refresh endpoint"""
    current_user = get_jwt_identity()
    new_token = create_access_token(identity=current_user)
    return jsonify({'access_token': new_token})

@app.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    current_user = get_jwt_identity()
    if current_user in USERS:
        user = USERS[current_user]
        return jsonify({
            'username': user['username'],
            'role': user['role']
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/auth/encryption-key', methods=['GET'])
@jwt_required()
def get_encryption_key():
    """Get encryption parameters for authenticated users"""
    current_user = get_jwt_identity()
    if current_user in USERS:
        # For production, we send algorithm info and a session identifier
        # The actual encryption uses random salt and IV per message
        # Provide session-level parameters and the session encryption password (base64)
        session_key_b64 = base64.b64encode(SESSION_ENCRYPTION_PASSWORD).decode('utf-8')
        return jsonify({
            'algorithm': 'AES-256-GCM',
            'key_derivation': 'PBKDF2-SHA256',
            'iterations': 100000,
            'session_id': secrets.token_urlsafe(16),
            'session_encryption_key': session_key_b64,
            'status': 'ready'
        })
    return jsonify({'error': 'Unauthorized'}), 401

@app.route('/backend/regression-data/', methods=['POST'])
@jwt_required()
def get_regression_data():
    """Get single regression data"""
    # Get request body parameters
    data = request.get_json()
    if not data:
        return jsonify({
            'error': 'Request body must be JSON',
            'required': ['structural_system', 'material', 'shape', 'environmental_flow']
        }), 400
    
    structural_system = data.get('structural_system')
    material = data.get('material')
    shape = data.get('shape')
    environmental_flow = data.get('environmental_flow')

    # Debug logging - remove in production
    print(f"DEBUG: API Request - {structural_system}, {material}, {shape}, {environmental_flow}")

    # Check required parameters
    if not all([structural_system, material, shape, environmental_flow]):
        return jsonify({
            'error': 'Missing required parameters',
            'required': ['structural_system', 'material', 'shape', 'environmental_flow']
        }), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = """
        SELECT structural_system, material, shape, environmental_flow, 
               intercept, coefficients, r_squared
        FROM premiums_data_new_old 
        WHERE structural_system = %s 
        AND material = %s 
        AND shape = %s 
        AND environmental_flow = %s
        """
        
        cursor.execute(query, (structural_system, material, shape, environmental_flow))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            # Ensure coefficients are in the correct JSON format
            if isinstance(result['coefficients'], str):
                result['coefficients'] = json.loads(result['coefficients'])
            
            # Return encrypted response
            return create_encrypted_response(dict(result))
        else:
            return create_encrypted_response(
                None, 
                success=False, 
                message='No data found for the specified combination'
            ), 404
            
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': f'Database query failed: {str(e)}'}), 500

@app.route('/backend/regression-data/batch/', methods=['POST'])
@jwt_required()
def get_regression_data_batch():
    """Get batch regression data"""
    try:
        combinations = request.json.get('combinations', [])
        
        if not combinations:
            return jsonify({'error': 'No combinations provided'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        results = []
        
        for combo in combinations:
            structural_system = combo.get('structural_system')
            material = combo.get('material')
            shape = combo.get('shape')
            environmental_flow = combo.get('environmental_flow')
            
            if not all([structural_system, material, shape, environmental_flow]):
                results.append({
                    'combination': combo,
                    'success': False,
                    'error': 'Missing required parameters'
                })
                continue
            
            query = """
            SELECT structural_system, material, shape, environmental_flow, 
                   intercept, coefficients, r_squared
            FROM premiums_data_new_old 
            WHERE structural_system = %s 
            AND material = %s 
            AND shape = %s 
            AND environmental_flow = %s
            """
            
            cursor.execute(query, (structural_system, material, shape, environmental_flow))
            result = cursor.fetchone()
            
            if result:
                # Ensure coefficients are in the correct JSON format
                if isinstance(result['coefficients'], str):
                    result['coefficients'] = json.loads(result['coefficients'])
                
                results.append({
                    'combination': combo,
                    'success': True,
                    'data': dict(result)
                })
            else:
                results.append({
                    'combination': combo,
                    'success': False,
                    'error': 'No data found'
                })
        
        cursor.close()
        conn.close()
        
        return create_encrypted_response(results)
        
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': f'Batch processing failed: {str(e)}'}), 500

@app.route('/backend/regression-data/combinations/', methods=['GET'])
@jwt_required()
def list_available_combinations():
    """List all available combinations"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        query = """
        SELECT DISTINCT structural_system, material, shape, environmental_flow
        FROM premiums_data_new_old 
        ORDER BY structural_system, material, shape, environmental_flow
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        combinations = [dict(row) for row in results]
        
        return create_encrypted_response({
            'combinations': combinations,
            'count': len(combinations)
        })
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': f'Failed to fetch combinations: {str(e)}'}), 500

if __name__ == '__main__':
    print("Starting Flask regression API server with JWT authentication...")
    print("Available endpoints:")
    print("  GET  /health - Health check")
    print("  POST /auth/login - User authentication")
    print("  POST /auth/refresh - Token refresh")
    print("  GET  /auth/me - Get current user info")
    print("  POST /backend/regression-data/ - Get single regression data (JWT required)")
    print("  POST /backend/regression-data/batch/ - Get batch regression data (JWT required)")
    print("  GET  /backend/regression-data/combinations/ - List all available combinations (JWT required)")
    print()
    print("Demo accounts:")
    print("  Admin: admin / admin123")
    print("  User:  user / user123")
    print()
    print("Server running at: http://localhost:8002")
    use_reloader = True
    try:
        watchdog_events_module = importlib.import_module('watchdog.events')
        getattr(watchdog_events_module, 'EVENT_TYPE_OPENED')
    except (ImportError, AttributeError):
        use_reloader = False
        print("Warning: watchdog.events.EVENT_TYPE_OPENED unavailable. Auto-reloader disabled.")

    app.run(host='0.0.0.0', port=8002, debug=True, use_reloader=use_reloader)
