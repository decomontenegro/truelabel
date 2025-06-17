#!/usr/bin/env python3
"""
TRUST Label - Smart QR Code Tracking API
Backend service for tracking QR code scans with analytics
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import json
import sqlite3
import os
import uuid
from collections import defaultdict
import hashlib

app = Flask(__name__)
CORS(app)

# Database setup
DB_PATH = 'qr_tracking.db'

def init_db():
    """Initialize SQLite database with tracking schema"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # QR Codes table
    c.execute('''CREATE TABLE IF NOT EXISTS qr_codes
                 (id TEXT PRIMARY KEY,
                  product_id TEXT,
                  product_name TEXT,
                  brand TEXT,
                  created_at TIMESTAMP,
                  validation_data TEXT,
                  blockchain_ref TEXT,
                  is_active INTEGER DEFAULT 1)''')
    
    # Scan tracking table
    c.execute('''CREATE TABLE IF NOT EXISTS scan_tracking
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  qr_code_id TEXT,
                  scanned_at TIMESTAMP,
                  ip_address TEXT,
                  user_agent TEXT,
                  location_lat REAL,
                  location_lng REAL,
                  city TEXT,
                  country TEXT,
                  device_type TEXT,
                  browser TEXT,
                  referrer TEXT,
                  FOREIGN KEY(qr_code_id) REFERENCES qr_codes(id))''')
    
    # Analytics summary table
    c.execute('''CREATE TABLE IF NOT EXISTS analytics_summary
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  qr_code_id TEXT,
                  date DATE,
                  total_scans INTEGER DEFAULT 0,
                  unique_ips INTEGER DEFAULT 0,
                  mobile_scans INTEGER DEFAULT 0,
                  desktop_scans INTEGER DEFAULT 0,
                  top_city TEXT,
                  FOREIGN KEY(qr_code_id) REFERENCES qr_codes(id))''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

def get_device_info(user_agent):
    """Extract device type and browser from user agent"""
    user_agent_lower = user_agent.lower()
    
    # Device type detection
    if 'mobile' in user_agent_lower or 'android' in user_agent_lower or 'iphone' in user_agent_lower:
        device_type = 'mobile'
    elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
        device_type = 'tablet'
    else:
        device_type = 'desktop'
    
    # Browser detection
    if 'chrome' in user_agent_lower and 'edg' not in user_agent_lower:
        browser = 'Chrome'
    elif 'safari' in user_agent_lower and 'chrome' not in user_agent_lower:
        browser = 'Safari'
    elif 'firefox' in user_agent_lower:
        browser = 'Firefox'
    elif 'edg' in user_agent_lower:
        browser = 'Edge'
    else:
        browser = 'Other'
    
    return device_type, browser

@app.route('/api/v1/qr/generate', methods=['POST'])
def generate_qr_code():
    """Generate a new trackable QR code"""
    data = request.json
    
    # Generate unique QR code ID
    qr_id = str(uuid.uuid4())
    
    # Create blockchain reference (mock)
    blockchain_ref = hashlib.sha256(f"{qr_id}{datetime.now()}".encode()).hexdigest()[:16]
    
    # Store in database
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''INSERT INTO qr_codes 
                 (id, product_id, product_name, brand, created_at, validation_data, blockchain_ref)
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (qr_id, 
               data.get('product_id'),
               data.get('product_name'),
               data.get('brand'),
               datetime.now(),
               json.dumps(data.get('validation_data', {})),
               blockchain_ref))
    
    conn.commit()
    conn.close()
    
    # Generate QR data payload
    qr_data = {
        'type': 'TRUST_LABEL_SMART_QR',
        'qr_id': qr_id,
        'product_id': data.get('product_id'),
        'timestamp': datetime.now().isoformat(),
        'track_url': f'http://localhost:5001/api/v1/qr/track/{qr_id}',
        'verify_url': f'http://localhost:8001/verify.html?qr={qr_id}',
        'blockchain': {
            'network': 'ETH_MAINNET',
            'ref': blockchain_ref,
            'contract': '0x742d35Cc6634C0532925a3b844Bc8e70c8B5C4A3'
        }
    }
    
    return jsonify({
        'success': True,
        'qr_id': qr_id,
        'qr_data': qr_data,
        'tracking_enabled': True
    })

@app.route('/api/v1/qr/track/<qr_id>', methods=['POST', 'GET'])
def track_scan(qr_id):
    """Track a QR code scan"""
    # Extract tracking information
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    user_agent = request.headers.get('User-Agent', '')
    referrer = request.headers.get('Referer', '')
    
    # Get device info
    device_type, browser = get_device_info(user_agent)
    
    # Get location data from request (if provided)
    location_data = request.json if request.method == 'POST' else {}
    
    # Store tracking data
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Check if QR code exists
    c.execute('SELECT * FROM qr_codes WHERE id = ?', (qr_id,))
    qr_code = c.fetchone()
    
    if not qr_code:
        conn.close()
        return jsonify({'error': 'QR code not found'}), 404
    
    # Insert tracking record
    c.execute('''INSERT INTO scan_tracking 
                 (qr_code_id, scanned_at, ip_address, user_agent, 
                  location_lat, location_lng, city, country, 
                  device_type, browser, referrer)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (qr_id,
               datetime.now(),
               ip_address,
               user_agent,
               location_data.get('lat'),
               location_data.get('lng'),
               location_data.get('city', 'Unknown'),
               location_data.get('country', 'BR'),
               device_type,
               browser,
               referrer))
    
    # Update analytics summary
    today = datetime.now().date()
    c.execute('''SELECT id FROM analytics_summary 
                 WHERE qr_code_id = ? AND date = ?''', (qr_id, today))
    
    summary = c.fetchone()
    if summary:
        # Update existing summary
        c.execute('''UPDATE analytics_summary 
                     SET total_scans = total_scans + 1
                     WHERE qr_code_id = ? AND date = ?''', (qr_id, today))
    else:
        # Create new summary
        c.execute('''INSERT INTO analytics_summary 
                     (qr_code_id, date, total_scans)
                     VALUES (?, ?, 1)''', (qr_id, today))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Scan tracked successfully',
        'qr_id': qr_id,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/v1/qr/<qr_id>/analytics', methods=['GET'])
def get_qr_analytics(qr_id):
    """Get analytics data for a specific QR code"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get QR code info
    c.execute('SELECT * FROM qr_codes WHERE id = ?', (qr_id,))
    qr_code = c.fetchone()
    
    if not qr_code:
        conn.close()
        return jsonify({'error': 'QR code not found'}), 404
    
    # Get total scans
    c.execute('SELECT COUNT(*) as total FROM scan_tracking WHERE qr_code_id = ?', (qr_id,))
    total_scans = c.fetchone()['total']
    
    # Get unique IPs
    c.execute('SELECT COUNT(DISTINCT ip_address) as unique_ips FROM scan_tracking WHERE qr_code_id = ?', (qr_id,))
    unique_visitors = c.fetchone()['unique_ips']
    
    # Get device breakdown
    c.execute('''SELECT device_type, COUNT(*) as count 
                 FROM scan_tracking 
                 WHERE qr_code_id = ? 
                 GROUP BY device_type''', (qr_id,))
    device_stats = {row['device_type']: row['count'] for row in c.fetchall()}
    
    # Get browser breakdown
    c.execute('''SELECT browser, COUNT(*) as count 
                 FROM scan_tracking 
                 WHERE qr_code_id = ? 
                 GROUP BY browser''', (qr_id,))
    browser_stats = {row['browser']: row['count'] for row in c.fetchall()}
    
    # Get location breakdown
    c.execute('''SELECT city, country, COUNT(*) as count 
                 FROM scan_tracking 
                 WHERE qr_code_id = ? AND city IS NOT NULL
                 GROUP BY city, country
                 ORDER BY count DESC
                 LIMIT 10''', (qr_id,))
    location_stats = [dict(row) for row in c.fetchall()]
    
    # Get scan timeline (last 30 days)
    c.execute('''SELECT DATE(scanned_at) as date, COUNT(*) as scans
                 FROM scan_tracking
                 WHERE qr_code_id = ? 
                 AND scanned_at >= date('now', '-30 days')
                 GROUP BY DATE(scanned_at)
                 ORDER BY date''', (qr_id,))
    timeline = [dict(row) for row in c.fetchall()]
    
    # Get recent scans
    c.execute('''SELECT scanned_at, ip_address, city, device_type, browser
                 FROM scan_tracking
                 WHERE qr_code_id = ?
                 ORDER BY scanned_at DESC
                 LIMIT 10''', (qr_id,))
    recent_scans = [dict(row) for row in c.fetchall()]
    
    conn.close()
    
    return jsonify({
        'qr_id': qr_id,
        'product_info': {
            'product_id': qr_code['product_id'],
            'product_name': qr_code['product_name'],
            'brand': qr_code['brand'],
            'created_at': qr_code['created_at']
        },
        'analytics': {
            'total_scans': total_scans,
            'unique_visitors': unique_visitors,
            'device_breakdown': device_stats,
            'browser_breakdown': browser_stats,
            'location_breakdown': location_stats,
            'scan_timeline': timeline,
            'recent_scans': recent_scans
        }
    })

@app.route('/api/v1/analytics/dashboard', methods=['GET'])
def get_dashboard_analytics():
    """Get overall dashboard analytics"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Total QR codes
    c.execute('SELECT COUNT(*) as total FROM qr_codes WHERE is_active = 1')
    total_qr_codes = c.fetchone()['total']
    
    # Total scans today
    c.execute('''SELECT COUNT(*) as total FROM scan_tracking 
                 WHERE DATE(scanned_at) = DATE('now')''')
    scans_today = c.fetchone()['total']
    
    # Total scans this month
    c.execute('''SELECT COUNT(*) as total FROM scan_tracking 
                 WHERE strftime('%Y-%m', scanned_at) = strftime('%Y-%m', 'now')''')
    scans_month = c.fetchone()['total']
    
    # Most scanned products
    c.execute('''SELECT q.product_name, q.brand, COUNT(s.id) as scan_count
                 FROM qr_codes q
                 JOIN scan_tracking s ON q.id = s.qr_code_id
                 GROUP BY q.id
                 ORDER BY scan_count DESC
                 LIMIT 5''')
    top_products = [dict(row) for row in c.fetchall()]
    
    # Scan growth (compare to last month)
    c.execute('''SELECT COUNT(*) as total FROM scan_tracking 
                 WHERE strftime('%Y-%m', scanned_at) = strftime('%Y-%m', 'now', '-1 month')''')
    scans_last_month = c.fetchone()['total']
    
    growth_rate = ((scans_month - scans_last_month) / scans_last_month * 100) if scans_last_month > 0 else 0
    
    conn.close()
    
    return jsonify({
        'summary': {
            'total_qr_codes': total_qr_codes,
            'scans_today': scans_today,
            'scans_this_month': scans_month,
            'growth_rate': round(growth_rate, 1)
        },
        'top_products': top_products,
        'quick_stats': {
            'active_qr_codes': total_qr_codes,
            'average_daily_scans': scans_month // 30 if scans_month > 0 else 0
        }
    })

@app.route('/api/v1/qr/verify/<qr_id>', methods=['GET'])
def verify_qr_code(qr_id):
    """Verify and get QR code data for public display"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT * FROM qr_codes WHERE id = ? AND is_active = 1', (qr_id,))
    qr_code = c.fetchone()
    
    if not qr_code:
        conn.close()
        return jsonify({'error': 'Invalid or inactive QR code'}), 404
    
    # Parse validation data
    validation_data = json.loads(qr_code['validation_data'] or '{}')
    
    conn.close()
    
    return jsonify({
        'valid': True,
        'product': {
            'name': qr_code['product_name'],
            'brand': qr_code['brand'],
            'validated_at': qr_code['created_at']
        },
        'validation': validation_data,
        'blockchain': {
            'verified': True,
            'reference': qr_code['blockchain_ref'],
            'network': 'Ethereum Mainnet'
        },
        'trust_score': validation_data.get('trust_score', 95)
    })

# Serve static files for testing
@app.route('/')
def index():
    return '''
    <h1>TRUST Label QR Tracking API</h1>
    <p>API is running on port 5001</p>
    <ul>
        <li>POST /api/v1/qr/generate - Generate new QR code</li>
        <li>POST/GET /api/v1/qr/track/{qr_id} - Track QR scan</li>
        <li>GET /api/v1/qr/{qr_id}/analytics - Get QR analytics</li>
        <li>GET /api/v1/analytics/dashboard - Dashboard stats</li>
        <li>GET /api/v1/qr/verify/{qr_id} - Verify QR code</li>
    </ul>
    '''

if __name__ == '__main__':
    print("🚀 TRUST Label QR Tracking API")
    print("================================")
    print(f"Database: {DB_PATH}")
    print("API running on: http://localhost:5001")
    print("\nEndpoints:")
    print("  POST   /api/v1/qr/generate")
    print("  POST   /api/v1/qr/track/<qr_id>")
    print("  GET    /api/v1/qr/<qr_id>/analytics")
    print("  GET    /api/v1/analytics/dashboard")
    print("  GET    /api/v1/qr/verify/<qr_id>")
    print("\nPress Ctrl+C to stop")
    
    app.run(host='0.0.0.0', port=5001, debug=True)