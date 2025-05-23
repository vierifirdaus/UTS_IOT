from flask import jsonify, request, send_file
from mysql_handler import connect_to_mysql
from encryption import decrypt_image
import base64
import json
from time import sleep
from io import BytesIO
import datetime
# API untuk pagination dan sorting gambar
def get_images():
    try:
        # Mendapatkan parameter dari request
        page = int(request.args.get('page', 1))  
        timestamp = request.args.get('timestamp', 'DESC')  
        limit = int(request.args.get('limit', 10))  # Mengonversi limit ke integer
        
        # Menghitung offset untuk pagination
        offset = (page - 1) * limit
        
        images = []
        conn = connect_to_mysql()
        if not conn:
            return jsonify({"error": "Unable to connect to MySQL"}), 500

        cursor = conn.cursor()
        
        # Mengambil gambar dengan pagination dan sorting berdasarkan timestamp
        cursor.execute(f"""
            SELECT id, image_data, timestamp 
            FROM images 
            ORDER BY timestamp {timestamp} 
            LIMIT {limit} OFFSET {offset}
        """)
        result = cursor.fetchall()

        for row in result:
            image_id, image_data, timestamp = row
            decrypted_image = decrypt_image(image_data)  # Dekripsi gambar
            image_base64 = base64.b64encode(decrypted_image).decode('utf-8')  # Convert ke Base64
            images.append({
                'id': image_id,
                'image_base64': image_base64,
                'timestamp': timestamp
            })

        # Mengambil total gambar di database untuk pagination
        cursor.execute("SELECT COUNT(1) FROM images")
        total = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        # Mengembalikan hasil dengan pagination dan total gambar
        return jsonify({
            'images': images,
            'page': page,
            'limit': limit,
            'total': total
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API untuk mendekripsi gambar berdasarkan ID
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
            download_name=f'image_{image_id}.jpg'
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
def get_information_image(image_id):
    conn = None
    cursor = None
    try:
        # Validate image_id
        try:
            image_id = int(image_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid image ID format"}), 400
        
        conn = connect_to_mysql()
        if not conn:
            return jsonify({"error": "Unable to connect to database"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Query all available fields from the table
        cursor.execute("""
            SELECT 
                id,
                image_data,
                timestamp,
                latency_db,
                capture_time,
                publish_time
            FROM images 
            WHERE id = %s
        """, (image_id,))
        
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"error": f"Image with ID {image_id} not found"}), 404
        
        # Handle image decryption
        try:
            encrypted_data = result['image_data']
            decrypted_data = decrypt_image(encrypted_data)
            image_base64 = base64.b64encode(decrypted_data).decode('utf-8')
        except Exception as e:
            return jsonify({"error": f"Image processing failed: {str(e)}"}), 500
        
        # Format timestamp if needed
        timestamp = result['timestamp']
        if isinstance(timestamp, (datetime.datetime, datetime.date)):
            timestamp = timestamp.isoformat()
        
        # Prepare response with all fields
        response = {
            'id': result['id'],
            'image': image_base64,
            'timestamp': timestamp,
            'latency_db': float(result['latency_db']) if result['latency_db'] is not None else 0,
            'capture_time': float(result['capture_time']) if result['capture_time'] is not None else 0,
            'publish_time': float(result['publish_time']) if result['publish_time'] is not None else 0
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()