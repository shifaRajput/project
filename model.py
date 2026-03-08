from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(200), nullable=False)
    brand = db.Column(db.String(100))
    #description = db.Column(db.Text)

    real_price = db.Column(db.Float, nullable=False)
    old_price = db.Column(db.Float)

    device_type = db.Column(db.String(50), nullable=False)

    grade = db.Column(db.String(20), nullable=False)

    discount = db.Column(db.Boolean, default=False)
    tagline = db.Column(db.String(300))
    key_specs = db.Column(db.Text)
    product_information = db.Column(db.Text)
    stock = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    media = db.relationship(
        'Media',
        backref='product',
        lazy=True,
        cascade="all, delete"
    )

    @property
    def product_id(self):
        # This creates the string "2MB-1001"
        # We use display_id to match your HTML template
        return f"2MB-{self.id + 1000}" if self.id else "New"
    
class Media(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    filename = db.Column(db.String(200))
    filetype = db.Column(db.String(20))  # image or video

    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))

# --- Customer Table ---
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    
    address = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)