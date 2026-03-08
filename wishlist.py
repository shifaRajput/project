from flask import Blueprint, request, jsonify
import sqlite3
import os

wishlist_bp = Blueprint('wishlist_bp', __name__)

# Define the database path (Fixes the "DB_PATH is not defined" error)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "wishlist.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price TEXT,
        image TEXT
    )
    """)
    conn.commit()
    conn.close()

# Initialize the DB when the module is loaded
init_db()

@wishlist_bp.route("/wishlist/add", methods=["POST"])
def add_product():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO wishlist (name, price, image) VALUES (?, ?, ?)",
                   (data["name"], data["price"], data["image"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Product added successfully"})

@wishlist_bp.route("/wishlist/get", methods=["GET"])
def get_products():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM wishlist")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

# Fixes the "Expected function or class declaration" error by completing the function
@wishlist_bp.route("/wishlist/delete/<int:id>", methods=["DELETE"])
def delete_product(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM wishlist WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Deleted successfully"})