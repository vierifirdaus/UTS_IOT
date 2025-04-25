import paho.mqtt.client as mqtt
from config import MQTT_BROKER, MQTT_PORT, MQTT_TOPIC, MQTT_USER, MQTT_PASS
import json
from encryption import encrypt_image
from mysql_handler import connect_to_mysql
import base64
import os
from dotenv import load_dotenv
load_dotenv()
# Konfigurasi MQTT
MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT"))
MQTT_TOPIC = os.getenv("MQTT_TOPIC")
MQTT_USER = os.getenv("MQTT_USER")
MQTT_PASS = os.getenv("MQTT_PASS")

def on_connect(client, userdata, flags, rc):
    """Callback saat berhasil terhubung ke MQTT"""
    print(f"Connected to MQTT broker with result code {rc}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    """Callback saat menerima pesan dari MQTT"""
    print(f"Message received on topic {msg.topic}")
    # Penanganan pesan diteruskan ke backend atau fungsi lain

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
