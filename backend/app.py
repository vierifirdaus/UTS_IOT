from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from routes import get_images, decrypt_image_api, get_information_image
from mqtt_handler import on_connect, on_message
import paho.mqtt.client as mqtt

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": os.getenv("URL_FRONTEND")}})

app.add_url_rule('/','home', lambda: "Welcome to the API", methods=['GET'])

app.add_url_rule('/images', 'get_images', get_images, methods=['GET'])
app.add_url_rule('/images/decrypt/<int:image_id>', 'decrypt_image_api', decrypt_image_api, methods=['GET'])
app.add_url_rule('/image/<int:image_id>','get_information_image',get_information_image, methods=['GET'])

def setup_mqtt():
    """Fungsi untuk setup MQTT"""
    mqtt_client = mqtt.Client()
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.username_pw_set(os.getenv("MQTT_USER"), os.getenv("MQTT_PASS"))
    mqtt_client.connect(os.getenv("MQTT_BROKER"), int(os.getenv("MQTT_PORT")), 60)
    
    mqtt_client.loop_start()

if __name__ == "__main__":
    setup_mqtt()  
    
    app.run(host="0.0.0.0", port=5000, debug=False)
