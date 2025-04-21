import base64
import mysql.connector
from flask import Flask, jsonify, request, send_file
import paho.mqtt.client as mqtt
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
from io import BytesIO
import json
from flask_cors import CORS  # Pastikan Flask-CORS diimpor

app = Flask(__name__)

# Mengaktifkan CORS untuk seluruh aplikasi Flask
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Menyediakan akses hanya untuk localhost:3000

# Konfigurasi MySQL
MYSQL_HOST = "212.85.26.216"
MYSQL_USER = "mqtt_user"
MYSQL_PASSWORD = "password"
MYSQL_DB = "image_storage"
MYSQL_PORT = 3306  # Port MySQL jika Anda mengubahnya di Docker

# Konfigurasi MQTT
MQTT_BROKER = "212.85.26.216"
MQTT_PORT = 1883
MQTT_TOPIC = "iot/image"
MQTT_USER = "vierifirdaus"
MQTT_PASS = "qwerty"

# Kunci AES (16 byte)
AES_KEY = b"1234567812345678"

def connect_to_mysql():
    """Koneksi ke MySQL"""
    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB
        )
        return conn
    except mysql.connector.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def encrypt_image(image_data):
    """Enkripsi gambar menggunakan AES CBC"""
    cipher = AES.new(AES_KEY, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(image_data, AES.block_size))
    iv = cipher.iv
    return iv + ct_bytes  

def decrypt_image(encrypted_data):
    """Dekripsi gambar menggunakan AES CBC"""
    iv = encrypted_data[:16]  # Ambil IV
    ct = encrypted_data[16:]  # Ambil ciphertext
    cipher = AES.new(AES_KEY, AES.MODE_CBC, iv=iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt

def on_connect(client, userdata, flags, rc):
    """Callback saat berhasil terhubung ke MQTT"""
    print(f"Connected to MQTT broker with result code {rc}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    """Callback saat menerima pesan dari MQTT"""
    print(f"Message received on topic {msg.topic}")
    
    try:
        payload = json.loads(msg.payload.decode('utf-8'))
        image_data_base64 = payload['image']
        
        # Mengonversi gambar Base64 ke bytes
        image_bytes = base64.b64decode(image_data_base64.split(',')[1] if ',' in image_data_base64 else image_data_base64)
        encrypted_image = encrypt_image(image_bytes)
        
        conn = connect_to_mysql()
        if conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO images (image_data) VALUES (%s)", (encrypted_image,))
            conn.commit()
            print("Encrypted image saved to MySQL database.")
            cursor.close()
            conn.close()
        else:
            print("Failed to connect to MySQL.")
    except Exception as e:
        print(f"Failed to process image: {e}")

# API untuk pagination dan sorting gambar
@app.route('/images', methods=['GET'])
def get_images():
    try:
        page = int(request.args.get('page', 1))  # Default page = 1
        sort = request.args.get('sort', 'timestamp')  # Default sorting by timestamp
        per_page = 10  # Jumlah gambar per halaman
        
        # Menghitung offset untuk pagination
        offset = (page - 1) * per_page
        
        conn = connect_to_mysql()
        if not conn:
            return jsonify({"error": "Unable to connect to MySQL"}), 500
        
        cursor = conn.cursor()
        
        # Query untuk mengambil gambar dengan pagination dan sorting
        cursor.execute(f"""
            SELECT id, image_data, timestamp 
            FROM images 
            ORDER BY {sort} DESC 
            LIMIT {per_page} OFFSET {offset}
        """)
        result = cursor.fetchall()

        images = []
        for row in result:
            image_id, image_data, timestamp = row
            decrypted_image = decrypt_image(image_data)  # Dekripsi gambar
            image_base64 = base64.b64encode(decrypted_image).decode('utf-8')  # Convert ke Base64
            images.append({
                'id': image_id,
                'image_base64': image_base64,
                'timestamp': timestamp
            })

        cursor.close()
        conn.close()
        
        return jsonify({'images': images, 'page': page, 'per_page': per_page})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API untuk mendekripsi gambar berdasarkan ID
@app.route('/decrypt/<int:image_id>', methods=['GET'])
def decrypt_image_api(image_id):
    try:
        conn = connect_to_mysql()
        if not conn:
            return jsonify({"error": "Unable to connect to MySQL"}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT image_data FROM images WHERE id = %s", (image_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"error": "Image not found"}), 404
        
        encrypted_data = result['image_data']
        decrypted_data = decrypt_image(encrypted_data)
        
        return send_file(
            BytesIO(decrypted_data),
            mimetype='image/jpeg',
            as_attachment=True,
            download_name=f'decrypted_{image_id}.jpg'
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/')
def home():
    return "MQTT Server is running. Waiting for images..."

if __name__ == "__main__":
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    
    mqtt_client.loop_start()
    
    app.run(host="0.0.0.0", port=5000, debug=False)  # Menjalankan Flask di semua alamat IP pada port 5000
