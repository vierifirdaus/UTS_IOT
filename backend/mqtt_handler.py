import paho.mqtt.client as mqtt
import json
import base64
import time
from mysql_handler import connect_to_mysql
from encryption import encrypt_image
import os
from dotenv import load_dotenv

load_dotenv()

MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT"))
MQTT_IMAGE_TOPIC = os.getenv("MQTT_IMAGE_TOPIC")
MQTT_LATENCY_TOPIC = os.getenv("MQTT_LATENCY_TOPIC")
MQTT_USER = os.getenv("MQTT_USER")
MQTT_PASS = os.getenv("MQTT_PASS")

pending_data = {}

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe([(MQTT_IMAGE_TOPIC, 0), (MQTT_LATENCY_TOPIC, 0)])

def on_message(client, userdata, msg):
    try:
        # First validate and decode the message
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
        except json.JSONDecodeError as e:
            print(f"Invalid JSON received: {msg.payload.decode('utf-8', errors='replace')}")
            return

        if 'id' not in payload:
            print("Missing 'id' field in payload")
            return

        message_id = payload['id']
        
        if msg.topic == MQTT_IMAGE_TOPIC:
            if 'image' not in payload:
                print(f"Missing 'image' field for ID: {message_id}")
                return
                
            pending_data[message_id] = {
                'image': payload['image'],
                'receive_time': time.time(),
                'has_image': True
            }
            print(f"Received image for ID: {message_id}")
            
        elif msg.topic == MQTT_LATENCY_TOPIC:
            if message_id not in pending_data or not pending_data[message_id]['has_image']:
                print(f"Waiting for image data for ID: {message_id}")
                return
                
            image_data = pending_data[message_id]
            
            try:
                # Handle base64 decoding (with or without data URI prefix)
                img_str = image_data['image']
                if ',' in img_str:
                    img_str = img_str.split(',')[1]
                image_bytes = base64.b64decode(img_str)
                encrypted_image = encrypt_image(image_bytes)
            except Exception as e:
                print(f"Image processing failed for ID {message_id}: {str(e)}")
                return
                
            capture_time = payload.get('capture_time', 0)  
            publish_time = payload.get('publish_time', 0)
            
            try:
                with connect_to_mysql() as conn:
                    with conn.cursor() as cursor:
                        # Fixed SQL query (4 placeholders for 4 values)
                        cursor.execute(
                            """INSERT INTO images 
                            (id, image_data, capture_time, publish_time) 
                            VALUES (%s, %s, %s, %s)""",  # Removed one %s
                            (message_id, encrypted_image, capture_time, publish_time)
                        )
                        conn.commit()
                        
                        db_latency = (time.time() - image_data['receive_time']) * 1000
                        cursor.execute(
                            "UPDATE images SET latency_db = %s WHERE id = %s",
                            (db_latency, message_id)
                        )
                        conn.commit()
                
                print(f"Saved ID:{message_id} | Capture:{capture_time}ms | Publish:{publish_time}ms | DB:{db_latency:.2f}ms")
                
            except Exception as db_error:
                print(f"Database error for ID {message_id}: {str(db_error)}")
                if conn:
                    conn.rollback()
            finally:
                if message_id in pending_data:
                    del pending_data[message_id]
                
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()