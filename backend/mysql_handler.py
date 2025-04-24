import mysql.connector
from config import MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB

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
