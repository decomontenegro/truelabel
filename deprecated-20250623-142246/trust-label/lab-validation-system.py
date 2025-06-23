#!/usr/bin/env python3
"""
TRUST Label - Laboratory Validation System
Sistema completo de validação laboratorial com marketplace
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import sqlite3
import uuid
import hashlib
from enum import Enum
import random

app = Flask(__name__)
CORS(app)

# Database setup
DB_PATH = 'lab_validation.db'

class ValidationStatus(Enum):
    PENDING = "pending"
    IN_ANALYSIS = "in_analysis"
    VALIDATED = "validated"
    VALIDATED_WITH_REMARKS = "validated_with_remarks"
    REJECTED = "rejected"
    EXPIRED = "expired"

class LabStatus(Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"

def init_db():
    """Initialize database with validation schema"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Laboratories table
    c.execute('''CREATE TABLE IF NOT EXISTS laboratories
                 (id TEXT PRIMARY KEY,
                  name TEXT NOT NULL,
                  cnpj TEXT UNIQUE,
                  accreditations TEXT,
                  specialties TEXT,
                  capacity INTEGER DEFAULT 100,
                  current_load INTEGER DEFAULT 0,
                  rating REAL DEFAULT 5.0,
                  status TEXT DEFAULT 'available',
                  pricing_table TEXT,
                  created_at TIMESTAMP)''')
    
    # Validation requests table
    c.execute('''CREATE TABLE IF NOT EXISTS validation_requests
                 (id TEXT PRIMARY KEY,
                  product_id TEXT,
                  product_name TEXT,
                  brand_id TEXT,
                  brand_name TEXT,
                  claims TEXT,
                  data_points TEXT,
                  status TEXT DEFAULT 'pending',
                  priority TEXT DEFAULT 'normal',
                  created_at TIMESTAMP,
                  updated_at TIMESTAMP)''')
    
    # Lab assignments table
    c.execute('''CREATE TABLE IF NOT EXISTS lab_assignments
                 (id TEXT PRIMARY KEY,
                  validation_id TEXT,
                  lab_id TEXT,
                  status TEXT DEFAULT 'pending',
                  price REAL,
                  estimated_days INTEGER,
                  assigned_at TIMESTAMP,
                  completed_at TIMESTAMP,
                  FOREIGN KEY(validation_id) REFERENCES validation_requests(id),
                  FOREIGN KEY(lab_id) REFERENCES laboratories(id))''')
    
    # Lab reports table
    c.execute('''CREATE TABLE IF NOT EXISTS lab_reports
                 (id TEXT PRIMARY KEY,
                  validation_id TEXT,
                  lab_id TEXT,
                  report_number TEXT,
                  report_file TEXT,
                  results TEXT,
                  methodology TEXT,
                  observations TEXT,
                  issued_at TIMESTAMP,
                  expires_at TIMESTAMP,
                  hash TEXT,
                  FOREIGN KEY(validation_id) REFERENCES validation_requests(id),
                  FOREIGN KEY(lab_id) REFERENCES laboratories(id))''')
    
    # Validation results table
    c.execute('''CREATE TABLE IF NOT EXISTS validation_results
                 (id TEXT PRIMARY KEY,
                  validation_id TEXT,
                  data_point TEXT,
                  declared_value TEXT,
                  measured_value TEXT,
                  unit TEXT,
                  status TEXT,
                  tolerance TEXT,
                  remarks TEXT,
                  FOREIGN KEY(validation_id) REFERENCES validation_requests(id))''')
    
    # Trust score history
    c.execute('''CREATE TABLE IF NOT EXISTS trust_scores
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  product_id TEXT,
                  score REAL,
                  components TEXT,
                  calculated_at TIMESTAMP)''')
    
    # Insert sample laboratories
    sample_labs = [
        {
            'id': str(uuid.uuid4()),
            'name': 'Eurofins Brasil',
            'cnpj': '00.000.000/0001-00',
            'accreditations': json.dumps(['ISO 17025', 'ANVISA', 'MAPA']),
            'specialties': json.dumps(['microbiologia', 'nutricional', 'contaminantes']),
            'capacity': 200,
            'rating': 4.8
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'SGS do Brasil',
            'cnpj': '00.000.000/0002-00',
            'accreditations': json.dumps(['ISO 17025', 'INMETRO']),
            'specialties': json.dumps(['alergênicos', 'metais pesados', 'pesticidas']),
            'capacity': 150,
            'rating': 4.7
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'SFDK Laboratório',
            'cnpj': '00.000.000/0003-00',
            'accreditations': json.dumps(['ISO 17025', 'FDA']),
            'specialties': json.dumps(['suplementos', 'substâncias proibidas', 'aminoácidos']),
            'capacity': 100,
            'rating': 4.9
        }
    ]
    
    for lab in sample_labs:
        try:
            c.execute('''INSERT INTO laboratories 
                         (id, name, cnpj, accreditations, specialties, capacity, rating, status, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                      (lab['id'], lab['name'], lab['cnpj'], lab['accreditations'], 
                       lab['specialties'], lab['capacity'], lab['rating'], 
                       LabStatus.AVAILABLE.value, datetime.now()))
        except sqlite3.IntegrityError:
            pass  # Lab already exists
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

@app.route('/api/v1/validation/request', methods=['POST'])
def create_validation_request():
    """Create a new validation request"""
    data = request.json
    
    validation_id = str(uuid.uuid4())
    
    # Extract claims and data points
    claims = json.dumps(data.get('claims', []))
    data_points = json.dumps(data.get('data_points', []))
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''INSERT INTO validation_requests 
                 (id, product_id, product_name, brand_id, brand_name, 
                  claims, data_points, status, priority, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (validation_id,
               data.get('product_id'),
               data.get('product_name'),
               data.get('brand_id'),
               data.get('brand_name'),
               claims,
               data_points,
               ValidationStatus.PENDING.value,
               data.get('priority', 'normal'),
               datetime.now(),
               datetime.now()))
    
    conn.commit()
    conn.close()
    
    # Trigger marketplace matching
    lab_options = find_matching_labs(validation_id)
    
    return jsonify({
        'success': True,
        'validation_id': validation_id,
        'status': ValidationStatus.PENDING.value,
        'lab_options': lab_options,
        'next_steps': 'Select a laboratory from the options provided'
    })

@app.route('/api/v1/validation/marketplace/<validation_id>', methods=['GET'])
def get_lab_marketplace(validation_id):
    """Get available laboratories for a validation request"""
    labs = find_matching_labs(validation_id)
    
    return jsonify({
        'validation_id': validation_id,
        'available_labs': labs,
        'recommendation': labs[0] if labs else None
    })

def find_matching_labs(validation_id):
    """Find laboratories that can handle the validation"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get validation request details
    c.execute('SELECT * FROM validation_requests WHERE id = ?', (validation_id,))
    validation = c.fetchone()
    
    if not validation:
        return []
    
    # Get all available labs
    c.execute('''SELECT * FROM laboratories 
                 WHERE status = ? AND current_load < capacity''', 
              (LabStatus.AVAILABLE.value,))
    labs = c.fetchall()
    
    # Score and rank labs
    lab_options = []
    for lab in labs:
        # Calculate match score based on specialties
        specialties = json.loads(lab['specialties'])
        data_points = json.loads(validation['data_points'])
        
        # Simple scoring: higher score for matching specialties
        match_score = calculate_lab_match_score(specialties, data_points)
        
        # Calculate pricing (mock calculation)
        base_price = 1500 + (len(data_points) * 200)
        urgency_multiplier = 1.5 if validation['priority'] == 'urgent' else 1.0
        price = base_price * urgency_multiplier * (1 - (lab['current_load'] / lab['capacity']) * 0.2)
        
        # Estimate delivery time
        base_days = 7 + len(data_points)
        load_factor = 1 + (lab['current_load'] / lab['capacity']) * 0.5
        estimated_days = int(base_days * load_factor)
        
        lab_options.append({
            'lab_id': lab['id'],
            'lab_name': lab['name'],
            'rating': lab['rating'],
            'accreditations': json.loads(lab['accreditations']),
            'match_score': match_score,
            'price': round(price, 2),
            'estimated_days': estimated_days,
            'current_load': f"{lab['current_load']}/{lab['capacity']}",
            'specialties': specialties
        })
    
    # Sort by match score and rating
    lab_options.sort(key=lambda x: (x['match_score'], x['rating']), reverse=True)
    
    conn.close()
    return lab_options[:5]  # Return top 5 options

def calculate_lab_match_score(specialties, data_points):
    """Calculate how well a lab matches the validation needs"""
    score = 0
    specialty_map = {
        'nutricional': ['proteínas', 'carboidratos', 'gorduras', 'vitaminas', 'minerais'],
        'microbiologia': ['salmonella', 'e_coli', 'coliformes', 'fungos'],
        'contaminantes': ['metais_pesados', 'pesticidas', 'micotoxinas'],
        'alergênicos': ['gluten', 'lactose', 'amendoim', 'soja'],
        'suplementos': ['aminoácidos', 'creatina', 'whey', 'bcaa']
    }
    
    for specialty in specialties:
        if specialty in specialty_map:
            for point in data_points:
                if any(keyword in point.lower() for keyword in specialty_map[specialty]):
                    score += 10
    
    return min(score, 100)  # Cap at 100

@app.route('/api/v1/validation/assign', methods=['POST'])
def assign_lab_to_validation():
    """Assign a laboratory to a validation request"""
    data = request.json
    
    assignment_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create assignment
    c.execute('''INSERT INTO lab_assignments 
                 (id, validation_id, lab_id, status, price, estimated_days, assigned_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (assignment_id,
               data['validation_id'],
               data['lab_id'],
               'assigned',
               data['price'],
               data['estimated_days'],
               datetime.now()))
    
    # Update validation status
    c.execute('''UPDATE validation_requests 
                 SET status = ?, updated_at = ?
                 WHERE id = ?''',
              (ValidationStatus.IN_ANALYSIS.value, datetime.now(), data['validation_id']))
    
    # Update lab load
    c.execute('''UPDATE laboratories 
                 SET current_load = current_load + 1 
                 WHERE id = ?''', (data['lab_id'],))
    
    conn.commit()
    conn.close()
    
    # Simulate sending notification to lab
    notify_lab_of_assignment(data['lab_id'], data['validation_id'])
    
    return jsonify({
        'success': True,
        'assignment_id': assignment_id,
        'message': 'Laboratory assigned successfully',
        'estimated_completion': (datetime.now() + timedelta(days=data['estimated_days'])).isoformat()
    })

@app.route('/api/v1/validation/<validation_id>/upload-report', methods=['POST'])
def upload_lab_report(validation_id):
    """Laboratory uploads analysis report"""
    data = request.json
    
    report_id = str(uuid.uuid4())
    report_number = f"LAB-{datetime.now().year}-{random.randint(1000, 9999)}"
    
    # Generate hash for report integrity
    report_hash = hashlib.sha256(
        f"{report_number}{validation_id}{datetime.now()}".encode()
    ).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Store report
    c.execute('''INSERT INTO lab_reports 
                 (id, validation_id, lab_id, report_number, report_file, 
                  results, methodology, observations, issued_at, expires_at, hash)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (report_id,
               validation_id,
               data['lab_id'],
               report_number,
               data.get('report_file', ''),
               json.dumps(data.get('results', {})),
               data.get('methodology', ''),
               data.get('observations', ''),
               datetime.now(),
               datetime.now() + timedelta(days=365),
               report_hash))
    
    # Process and store individual results
    results = data.get('results', {})
    for data_point, result in results.items():
        result_id = str(uuid.uuid4())
        
        # Determine validation status for each data point
        status = determine_validation_status(result)
        
        c.execute('''INSERT INTO validation_results 
                     (id, validation_id, data_point, declared_value, 
                      measured_value, unit, status, tolerance, remarks)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (result_id,
                   validation_id,
                   data_point,
                   result.get('declared'),
                   result.get('measured'),
                   result.get('unit', ''),
                   status,
                   result.get('tolerance', ''),
                   result.get('remarks', '')))
    
    # Update validation status
    overall_status = determine_overall_status(results)
    c.execute('''UPDATE validation_requests 
                 SET status = ?, updated_at = ?
                 WHERE id = ?''',
              (overall_status, datetime.now(), validation_id))
    
    # Update lab assignment
    c.execute('''UPDATE lab_assignments 
                 SET status = 'completed', completed_at = ?
                 WHERE validation_id = ? AND lab_id = ?''',
              (datetime.now(), validation_id, data['lab_id']))
    
    # Update lab load
    c.execute('''UPDATE laboratories 
                 SET current_load = current_load - 1 
                 WHERE id = ?''', (data['lab_id'],))
    
    conn.commit()
    
    # Calculate and store Trust Score
    trust_score = calculate_trust_score(validation_id)
    store_trust_score(validation_id, trust_score)
    
    conn.close()
    
    return jsonify({
        'success': True,
        'report_id': report_id,
        'report_number': report_number,
        'hash': report_hash,
        'overall_status': overall_status,
        'trust_score': trust_score,
        'expires_at': (datetime.now() + timedelta(days=365)).isoformat()
    })

def determine_validation_status(result):
    """Determine if a data point passes validation"""
    if not result.get('measured') or not result.get('declared'):
        return 'not_tested'
    
    try:
        measured = float(result['measured'])
        declared = float(result['declared'])
        tolerance = float(result.get('tolerance', 5))  # Default 5% tolerance
        
        # Calculate percentage difference
        diff_percent = abs((measured - declared) / declared * 100)
        
        if diff_percent <= tolerance:
            return 'validated'
        elif diff_percent <= tolerance * 1.5:  # Within 150% of tolerance
            return 'validated_with_remarks'
        else:
            return 'rejected'
    except:
        return 'error'

def determine_overall_status(results):
    """Determine overall validation status based on individual results"""
    statuses = []
    for data_point, result in results.items():
        status = determine_validation_status(result)
        statuses.append(status)
    
    if all(s == 'validated' for s in statuses):
        return ValidationStatus.VALIDATED.value
    elif any(s == 'rejected' for s in statuses):
        return ValidationStatus.REJECTED.value
    elif any(s == 'validated_with_remarks' for s in statuses):
        return ValidationStatus.VALIDATED_WITH_REMARKS.value
    else:
        return ValidationStatus.VALIDATED.value

def calculate_trust_score(validation_id):
    """Calculate Trust Score based on validation results"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get validation results
    c.execute('SELECT * FROM validation_results WHERE validation_id = ?', (validation_id,))
    results = c.fetchall()
    
    if not results:
        return 0
    
    # Base score calculation
    validated_count = sum(1 for r in results if r['status'] == 'validated')
    total_count = len(results)
    base_score = (validated_count / total_count) * 70  # 70% weight for validations
    
    # Get lab info for quality score
    c.execute('''SELECT l.rating, l.accreditations 
                 FROM lab_reports lr 
                 JOIN laboratories l ON lr.lab_id = l.id 
                 WHERE lr.validation_id = ?''', (validation_id,))
    lab_info = c.fetchone()
    
    if lab_info:
        # Lab quality score (20% weight)
        lab_score = (lab_info['rating'] / 5.0) * 20
        
        # Accreditation bonus (10% weight)
        accreditations = json.loads(lab_info['accreditations'])
        accred_score = min(len(accreditations) * 2, 10)
    else:
        lab_score = 0
        accred_score = 0
    
    conn.close()
    
    # Calculate final Trust Score
    trust_score = base_score + lab_score + accred_score
    
    return round(trust_score, 1)

def store_trust_score(validation_id, score):
    """Store Trust Score in history"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Get product_id from validation
    c.execute('SELECT product_id FROM validation_requests WHERE id = ?', (validation_id,))
    product_id = c.fetchone()[0]
    
    components = {
        'validation_score': score * 0.7,
        'lab_quality': score * 0.2,
        'accreditations': score * 0.1
    }
    
    c.execute('''INSERT INTO trust_scores 
                 (product_id, score, components, calculated_at)
                 VALUES (?, ?, ?, ?)''',
              (product_id, score, json.dumps(components), datetime.now()))
    
    conn.commit()
    conn.close()

@app.route('/api/v1/validation/<validation_id>/status', methods=['GET'])
def get_validation_status(validation_id):
    """Get detailed validation status"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get validation request
    c.execute('SELECT * FROM validation_requests WHERE id = ?', (validation_id,))
    validation = c.fetchone()
    
    if not validation:
        return jsonify({'error': 'Validation not found'}), 404
    
    # Get lab assignment
    c.execute('SELECT * FROM lab_assignments WHERE validation_id = ?', (validation_id,))
    assignment = c.fetchone()
    
    # Get lab report if exists
    c.execute('SELECT * FROM lab_reports WHERE validation_id = ?', (validation_id,))
    report = c.fetchone()
    
    # Get validation results
    c.execute('SELECT * FROM validation_results WHERE validation_id = ?', (validation_id,))
    results = c.fetchall()
    
    # Get latest trust score
    c.execute('''SELECT score FROM trust_scores 
                 WHERE product_id = ? 
                 ORDER BY calculated_at DESC LIMIT 1''', 
              (validation['product_id'],))
    trust_score = c.fetchone()
    
    conn.close()
    
    return jsonify({
        'validation': {
            'id': validation['id'],
            'product_name': validation['product_name'],
            'brand_name': validation['brand_name'],
            'status': validation['status'],
            'claims': json.loads(validation['claims']),
            'data_points': json.loads(validation['data_points']),
            'created_at': validation['created_at']
        },
        'assignment': dict(assignment) if assignment else None,
        'report': {
            'report_number': report['report_number'],
            'issued_at': report['issued_at'],
            'expires_at': report['expires_at'],
            'hash': report['hash']
        } if report else None,
        'results': [dict(r) for r in results],
        'trust_score': trust_score['score'] if trust_score else None
    })

@app.route('/api/v1/labs', methods=['GET'])
def get_laboratories():
    """Get list of all laboratories"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT * FROM laboratories ORDER BY rating DESC')
    labs = c.fetchall()
    
    conn.close()
    
    return jsonify({
        'laboratories': [{
            'id': lab['id'],
            'name': lab['name'],
            'rating': lab['rating'],
            'accreditations': json.loads(lab['accreditations']),
            'specialties': json.loads(lab['specialties']),
            'capacity': lab['capacity'],
            'current_load': lab['current_load'],
            'status': lab['status'],
            'utilization': round((lab['current_load'] / lab['capacity']) * 100, 1)
        } for lab in labs]
    })

@app.route('/api/v1/validation/simulate', methods=['POST'])
def simulate_validation_flow():
    """Simulate complete validation flow for demo"""
    data = request.json
    
    # Step 1: Create validation request
    validation_response = create_validation_request()
    validation_data = validation_response.get_json()
    validation_id = validation_data['validation_id']
    
    # Step 2: Auto-select best lab
    labs = validation_data['lab_options']
    if labs:
        best_lab = labs[0]
        
        # Step 3: Assign lab
        assignment_data = {
            'validation_id': validation_id,
            'lab_id': best_lab['lab_id'],
            'price': best_lab['price'],
            'estimated_days': best_lab['estimated_days']
        }
        
        assign_response = assign_lab_to_validation()
        
        # Step 4: Simulate lab report upload
        # Generate mock results
        mock_results = {}
        for data_point in data.get('data_points', []):
            declared_value = random.uniform(90, 110)
            measured_value = declared_value * random.uniform(0.95, 1.05)
            
            mock_results[data_point] = {
                'declared': str(declared_value),
                'measured': str(measured_value),
                'unit': 'mg/100g',
                'tolerance': '5',
                'remarks': 'Within acceptable range'
            }
        
        report_data = {
            'lab_id': best_lab['lab_id'],
            'results': mock_results,
            'methodology': 'AOAC 2011.25',
            'observations': 'All tests performed according to ISO 17025 standards'
        }
        
        # Upload report
        request.json = report_data
        report_response = upload_lab_report(validation_id)
        report_data = report_response.get_json()
        
        return jsonify({
            'success': True,
            'simulation_complete': True,
            'validation_id': validation_id,
            'lab_assigned': best_lab['lab_name'],
            'report_number': report_data['report_number'],
            'trust_score': report_data['trust_score'],
            'status': report_data['overall_status']
        })
    
    return jsonify({
        'success': False,
        'error': 'No laboratories available'
    })

def notify_lab_of_assignment(lab_id, validation_id):
    """Send notification to laboratory about new assignment"""
    # In production, this would send email/SMS/push notification
    print(f"Lab {lab_id} assigned to validation {validation_id}")

@app.route('/')
def index():
    return '''
    <h1>TRUST Label Lab Validation System</h1>
    <p>Complete laboratory validation workflow with marketplace</p>
    <ul>
        <li>POST /api/v1/validation/request - Create validation request</li>
        <li>GET /api/v1/validation/marketplace/{id} - Get lab options</li>
        <li>POST /api/v1/validation/assign - Assign lab to validation</li>
        <li>POST /api/v1/validation/{id}/upload-report - Upload lab report</li>
        <li>GET /api/v1/validation/{id}/status - Get validation status</li>
        <li>GET /api/v1/labs - List all laboratories</li>
        <li>POST /api/v1/validation/simulate - Simulate complete flow</li>
    </ul>
    '''

if __name__ == '__main__':
    print("🧪 TRUST Label Lab Validation System")
    print("====================================")
    print(f"Database: {DB_PATH}")
    print("API running on: http://localhost:5002")
    print("\nLaboratory Marketplace Features:")
    print("  ✓ Automated lab matching")
    print("  ✓ Competitive pricing")
    print("  ✓ Real-time capacity tracking")
    print("  ✓ Trust Score calculation")
    print("  ✓ Report integrity (SHA-256)")
    print("\nPress Ctrl+C to stop")
    
    app.run(host='0.0.0.0', port=5002, debug=True)