from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, send_from_directory
import sqlite3
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

# Initialize as a Blueprint
payment_bp = Blueprint('payment', __name__)

# Change this in payment.py
BASE_DIR = os.path.abspath(os.path.dirname(__file__)) # Ensure absolute path
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "ecommerce.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    
    # Tables setup
    c.execute('''CREATE TABLE IF NOT EXISTS user (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL, address TEXT, phone TEXT)''')
        
    c.execute('''CREATE TABLE IF NOT EXISTS products (
            product_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, description TEXT, price REAL NOT NULL)''')
        
    c.execute('''CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL, product_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1, total_price REAL NOT NULL,
            status TEXT DEFAULT 'pending', payment_method TEXT,
            delivery_address TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date_packed TEXT, date_shipped TEXT, date_out_for_delivery TEXT, 
            date_delivered TEXT, date_return_requested TEXT,
            FOREIGN KEY(user_id) REFERENCES users(user_id),
            FOREIGN KEY(product_id) REFERENCES products(product_id))''')

    # Dummy Data Setup
    if c.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        c.execute("INSERT INTO products (name, description, price) VALUES ('Refurbished iPhone 13', '128GB, Midnight', 38000.00)")
        c.execute("INSERT INTO products (name, description, price) VALUES ('MacBook Air M1', '8GB RAM, 256GB SSD', 55000.00)")

    if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        c.execute("INSERT INTO users (name, email, password) VALUES ('Vidhi Mamania', 'vidhimamania.2005@gmail.com', '123456')")

    c.execute("SELECT user_id FROM users LIMIT 1")
    first_user = c.fetchone()
    if first_user:
        if c.execute("SELECT COUNT(*) FROM orders WHERE status='pending'").fetchone()[0] == 0:
            c.execute("INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES (?, 1, 1, 38000.00)", (first_user['user_id'],))

    conn.commit()
    conn.close()

# --- Email Helper Function ---
def send_order_email(to_email, user_name):
    # Connected using your actual credentials
    sender_email = "2mbcomputers@gmail.com" 
    sender_password = "topb lllq rxcb zeyn" 

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = "Order Confirmation - 2 MB Computers"

    body = f"Hello {user_name},\n\nYour order has been successfully placed! Thanks for selecting 2MB Computers.\n\nYou can track your order status in the My Orders section."
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Using SMTP_SSL on port 465 to match your working Login_SignUp.py
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

# ----------------- ROUTES -----------------


@payment_bp.route('/payment.js')
def serve_js():
    return send_from_directory(BASE_DIR, 'payment.js')

@payment_bp.route('/api/get-user', methods=['POST'])
def get_user_by_name():
    data = request.json
    name = data.get('name')
    if not name: return jsonify({"success": False})

    conn = get_db()
    user = conn.execute("SELECT phone, address FROM user WHERE name = ? COLLATE NOCASE", (name,)).fetchone()
    conn.close()

    if user:
        return jsonify({"success": True, "phone": user['phone'] or "", "address": user['address'] or ""})
    return jsonify({"success": False})

@payment_bp.route('/checkout')
def checkout():
    # If no session, set a dummy one for testing (remove this in production)
    if 'user_email' not in session:
        session['user_email'] = 'vidhimamania.2005@gmail.com' 
        
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email=?", (session['user_email'],)).fetchone()
    conn.close()
    
    return render_template("payment.html", user=user)

@payment_bp.route('/api/my-orders')
def get_my_orders():
    if 'user_email' not in session: return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db()
    user = conn.execute("SELECT user_id, name FROM user WHERE email=?", (session['user_email'],)).fetchone()
    
    orders = conn.execute("""
        SELECT o.id as order_id, o.quantity, o.total_price, o.status, 
               p.name as product_name, p.description as product_description 
        FROM orders o JOIN products p ON o.product_id = p.product_id
        WHERE o.user_id = ? AND o.status = 'pending'
    """, (user['user_id'],)).fetchall()
    conn.close()
    
    return jsonify({"username": user['name'], "orders": [dict(row) for row in orders]})

@payment_bp.route('/api/pay/<int:order_id>', methods=['POST'])
def process_payment(order_id):
    if 'user_email' not in session: return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    method = data.get('payMethod')
    new_address = data.get('address')
    new_phone = data.get('phone')
    
    conn = get_db()
    c = conn.cursor()
    user = c.execute("SELECT user_id, name, email, phone, address FROM user WHERE email=?", (session['user_email'],)).fetchone()
    u_id = user['user_id']
    user_email = user['email']
    user_name = user['name']

    c.execute("""
        UPDATE orders 
        SET status='Order Placed', payment_method=?, delivery_address=? 
        WHERE id=? AND user_id=?
    """, (method, new_address, order_id, u_id))

    if not user['phone'] or not user['address']:
        c.execute("UPDATE user SET phone=COALESCE(phone, ?), address=COALESCE(address, ?) WHERE user_id=?", (new_phone, new_address, u_id))

    conn.commit()
    conn.close()
    
    # Trigger the background email!
    threading.Thread(target=send_order_email, args=(user_email, user_name)).start()
    
    return jsonify({"success": True})

@payment_bp.route('/add-test-orders')
def add_test_orders():
    try:
        conn = get_db()
        c = conn.cursor()
        
        # Get your specific user account
        c.execute("SELECT user_id FROM user WHERE email='vidhimamania.2005@gmail.com'")
        user = c.fetchone()
        
        if user:
            u_id = user['user_id']
            # Add an iPhone 13 to your cart
            c.execute("INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES (?, 1, 1, 38000.00, 'pending')", (u_id,))
            # Add a MacBook to your cart
            c.execute("INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES (?, 2, 1, 55000.00, 'pending')", (u_id,))
            
            conn.commit()
            conn.close()
            return "<h1>✅ Added 2 test orders!</h1><p><a href='/'>Click here to go to Checkout and see them in your bag.</a></p>"
        else:
            conn.close()
            return "User not found in database!"
    except Exception as e:
        return f"Error: {e}"
    
    # Add this route to your payment.py
@payment_bp.route('/initiate-checkout/<int:product_id>')
def initiate_checkout(product_id):
    if 'user_email' not in session:
        return redirect(url_for('auth.auth_page')) # Adjust to your actual auth route

    conn = get_db()
    c = conn.cursor()
    
    # 1. Get user ID
    user = c.execute("SELECT user_id FROM user WHERE email=?", (session['user_email'],)).fetchone()
    
    # 2. Get product price
    product = c.execute("SELECT price FROM products WHERE product_id=?", (product_id,)).fetchone()
    
    # 3. Create a pending order record
    c.execute('''INSERT INTO orders (user_id, product_id, quantity, total_price, status) 
                 VALUES (?, ?, 1, ?, 'pending')''', 
              (user['user_id'], product_id, product['price']))
    
    conn.commit()
    conn.close()
    
    # 4. Redirect to your existing checkout page
    return redirect(url_for('payment.checkout'))