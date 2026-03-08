from flask import Blueprint, request, jsonify, session
import sqlite3
from model import db, Product

cart_bp = Blueprint('cart_api', __name__)

# ----------------------
# DATABASE CREATE
# ----------------------
def create_table():
    conn = sqlite3.connect("wishlist.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            image TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

create_table()

# ----------------------
# ADD PRODUCT
# ----------------------
@cart_bp.route("/add", methods=["POST"])
def add_product():
    data = request.get_json()

    name = data.get("name")
    price = data.get("price")
    image = data.get("image")

    conn = sqlite3.connect("wishlist.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO wishlist (name, price, image) VALUES (?, ?, ?)",
        (name, price, image)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Product Added"}), 200


# ----------------------
# GET PRODUCTS
# ----------------------
@cart_bp.route("/get", methods=["GET"])
def get_products():
    conn = sqlite3.connect("wishlist.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM wishlist")
    rows = cursor.fetchall()
    conn.close()

    products = []
    for row in rows:
        products.append({
            "id": row[0],
            "name": row[1],
            "price": row[2],
            "image": row[3]
        })

    return jsonify(products), 200


# ----------------------
# DELETE PRODUCT
# ----------------------
@cart_bp.route("/delete/<int:id>", methods=["DELETE"])
def delete_product(id):
    conn = sqlite3.connect("wishlist.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM wishlist WHERE id=?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Deleted"}), 200


if __name__ == "__main__":
    cart_bp.route.run()