import sqlite3
import os
from datetime import datetime
from flask import Blueprint, render_template, request, jsonify, send_from_directory

sell_bp = Blueprint('sell_bp', __name__)

DB_PATH = "users.db"
UPLOAD_FOLDER = os.path.join("static", "uploads", "sell_photos")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_sell_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sell_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT,
            brand TEXT,
            model TEXT,
            price REAL,
            condition TEXT,
            description TEXT,
            photos TEXT,
            status TEXT DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )
    ''')
    conn.commit()
    conn.close()

init_sell_db()

@sell_bp.route("/sell")
def sell_page():
    return render_template("sell.html")

# NEW ROUTE: Searches the users.db for the email typed in the box
@sell_bp.route("/api/get-user", methods=["POST"])
def get_user():
    data = request.json
    email = data.get('email')
    
    conn = get_db_connection()
    user = conn.execute("SELECT user_id, name, phone FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    
    if user:
        return jsonify({"status": "success", "user_id": user['user_id'], "name": user['name'], "phone": user['phone']})
    return jsonify({"status": "error", "message": "User not found"})

@sell_bp.route("/api/sell-device", methods=["POST"])
def sell_device():
    email = request.form.get("userEmail")
    
    # Check if the user exists in users.db before allowing the sale
    conn = get_db_connection()
    user = conn.execute("SELECT user_id FROM users WHERE email = ?", (email,)).fetchone()
    
    if not user:
        conn.close()
        return jsonify({"status": "error", "message": "Email not found. Please register first."}), 400
        
    user_id = user['user_id']
    
    try:
        # --- YOUR IMAGE UPLOAD LOGIC (Already works perfectly!) ---
        files = request.files.getlist("photos")
        if len(files) < 1 or len(files) > 5:
            return jsonify({"status": "error", "message": "Upload 1 to 5 photos."}), 400
        
        photo_paths = []
        for file in files:
            if file.filename:
                filename = f"{datetime.now().timestamp()}_{file.filename.replace(' ', '_')}"
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
                photo_paths.append(f"uploads/sell_photos/{filename}")
        
        # Insert the data and image paths into the sell_requests table inside users.db
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO sell_requests (user_id, category, brand, model, price, condition, description, photos)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            request.form.get("category"),
            request.form.get("brand"),
            request.form.get("model"),
            request.form.get("price"),
            request.form.get("condition"),
            request.form.get("description"),
            ",".join(photo_paths) # This saves the image paths successfully!
        ))
        
        request_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "id": f"US{request_id:03d}"})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    sell_bp.run(debug=True, port=5000)