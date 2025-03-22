from flask import Flask, jsonify, request
from flask_cors import CORS
import speedtest
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="admin",
        database="isp_db"
    )

@app.route('/speedtest', methods=['GET'])
def run_speed_test():
    try:
        st = speedtest.Speedtest()
        st.get_best_server()
        download_speed = st.download() / 1_000_000  # Convert to Mbps
        upload_speed = st.upload() / 1_000_000  # Convert to Mbps
        ping = st.results.ping
        timestamp = datetime.now()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO speed_tests (ping, download_speed, upload_speed, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (ping, download_speed, upload_speed, timestamp))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "ping": ping,
            "download_speed": download_speed,
            "upload_speed": upload_speed,
            "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/history', methods=['GET'])
def get_speed_history():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM speed_tests ORDER BY timestamp DESC")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Make accessible from other devices
