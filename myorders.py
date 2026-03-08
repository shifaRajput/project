from flask import Blueprint, jsonify, render_template, send_from_directory, request, session
import sqlite3
import os
from datetime import datetime

# 1. Initialize the Blueprint FIRST so Python knows what it is
myorders_bp = Blueprint('myorders', __name__)

BASE_DIR = os.path.dirname(__file__)
DB_PATH  = os.path.join(BASE_DIR, "users.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def now():
    return datetime.now().strftime("%Y-%m-%d %H:%M")

# ─── PAGES & ASSETS ───────────────────────────────────────────────────────────

# Customer Orders Page
@myorders_bp.route('/myorders')
def order_page():
    return render_template('myorders.html')

@myorders_bp.route('/myorders.js')
def serve_js():
    return send_from_directory(os.path.dirname(__file__), 'myorders.js')

# Admin Orders Page
@myorders_bp.route('/admin/orders')
def admin_orders_page():
    return render_template('admin_orders.html')

@myorders_bp.route('/refurbished/admin_orders.js')
def serve_admin_js():
    return send_from_directory(os.path.join(BASE_DIR, 'refurbished'), 'admin_orders.js')

# ─── CUSTOMER APIs ─────────────────────────────────────────────────────────────

@myorders_bp.route('/api/orders')
def get_orders():
    try:
        conn = get_db()
        if 'user_email' in session:
            user = conn.execute("SELECT user_id FROM users WHERE email=?", (session['user_email'],)).fetchone()
            user_id = user['user_id'] if user else None
        else:
            user_id = None

        if user_id:
            rows = conn.execute("""
                SELECT o.id AS order_id, p.name AS product_name, p.image_url AS image_url,
                    o.total_price AS price, o.quantity, o.status, o.created_at AS date_ordered,
                    o.date_packed, o.date_shipped, o.date_out_for_delivery, o.date_delivered,
                    o.date_return_requested, o.delivery_address
                FROM orders o JOIN products p ON o.product_id = p.product_id
                WHERE o.user_id = ? AND o.status != 'pending' ORDER BY o.created_at DESC
            """, (user_id,)).fetchall()
        else:
            rows = conn.execute("""
                SELECT o.id AS order_id, p.name AS product_name, p.image_url AS image_url,
                    o.total_price AS price, o.quantity, o.status, o.created_at AS date_ordered,
                    o.date_packed, o.date_shipped, o.date_out_for_delivery, o.date_delivered,
                    o.date_return_requested, o.delivery_address
                FROM orders o JOIN products p ON o.product_id = p.product_id
                WHERE o.status != 'pending' ORDER BY o.created_at DESC
            """).fetchall()

        conn.close()
        return jsonify([dict(r) for r in rows])
    except Exception as e:
        print(f"[ERROR] get_orders: {e}")
        return jsonify([]), 500

@myorders_bp.route('/api/cancel-order/<int:order_id>', methods=['POST'])
def cancel_order(order_id):
    try:
        conn = get_db()
        order = conn.execute("SELECT status FROM orders WHERE id=?", (order_id,)).fetchone()
        if not order:
            return jsonify({"success": False, "error": "Order not found"}), 404
        if order['status'] in ('Out for Delivery', 'Received', 'Return Requested', 'Returned'):
            return jsonify({"success": False, "error": "Cannot cancel at this stage"}), 400

        conn.execute("UPDATE orders SET status='Cancelled' WHERE id=?", (order_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@myorders_bp.route('/api/return-order/<int:order_id>', methods=['POST'])
def return_order(order_id):
    try:
        conn = get_db()
        order = conn.execute("SELECT status FROM orders WHERE id=?", (order_id,)).fetchone()
        if not order:
            return jsonify({"success": False, "error": "Order not found"}), 404
        if order['status'] != 'Received':
            return jsonify({"success": False, "error": "Returns only allowed after delivery"}), 400

        conn.execute("UPDATE orders SET status='Return Requested', date_return_requested=? WHERE id=?", (now(), order_id))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ─── ADMIN APIs ───────────────────────────────────────────────────────────────

VALID_ADMIN_TRANSITIONS = {
    "Order Placed":      "Packed",
    "Packed":            "Shipped",
    "Shipped":           "Out for Delivery",
    "Out for Delivery":  "Received",
    "Return Requested":  "Returned"
}

DATE_COLUMNS = {
    "Packed":           "date_packed",
    "Shipped":          "date_shipped",
    "Out for Delivery": "date_out_for_delivery",
    "Received":         "date_delivered"
}

@myorders_bp.route('/api/admin/orders', methods=['GET'])
def admin_get_orders():
    try:
        conn  = get_db()
        rows  = conn.execute("""
            SELECT o.id AS order_id, u.name AS customer_name, u.email AS customer_email,
                p.name AS product_name, o.quantity, o.total_price, o.status,
                o.delivery_address, o.created_at
            FROM orders o JOIN users u ON o.user_id = u.user_id JOIN products p ON o.product_id = p.product_id
            WHERE o.status NOT IN ('pending', 'Cancelled', 'Returned') ORDER BY o.created_at DESC
        """).fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@myorders_bp.route('/api/admin/advance-order/<int:order_id>', methods=['POST'])
def admin_advance_order(order_id):
    try:
        conn  = get_db()
        order = conn.execute("SELECT status FROM orders WHERE id=?", (order_id,)).fetchone()
        if not order:
            return jsonify({"success": False, "error": "Order not found"}), 404

        current = order['status']
        nxt     = VALID_ADMIN_TRANSITIONS.get(current)

        if not nxt:
            return jsonify({"success": False, "error": f"Cannot advance from '{current}'"}), 400

        date_col = DATE_COLUMNS.get(nxt)
        if date_col:
            conn.execute(f"UPDATE orders SET status=?, {date_col}=? WHERE id=?", (nxt, now(), order_id))
        else:
            conn.execute("UPDATE orders SET status=? WHERE id=?", (nxt, order_id))

        conn.commit()
        conn.close()
        return jsonify({"success": True, "new_status": nxt})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500