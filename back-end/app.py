from flask import Flask, jsonify, request
from flask_cors import CORS
import speedtest
import mysql.connector
from datetime import datetime
import requests
import socket

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ISP Support Information Database
ISP_CONTACTS = {
    "afrihost": {
        "name": "Afrihost",
        "support_phone": "087 820 0000",
        "support_email": "support@afrihost.co.za",
        "whatsapp": "087 820 0000",
        "website": "https://www.afrihost.com/support",
        "live_chat": "https://www.afrihost.com/support/chat",
        "social_media": {
            "twitter": "@afrihost",
            "facebook": "AfrhostSA"
        }
    },
    "vodacom": {
        "name": "Vodacom",
        "support_phone": "082 135",
        "support_email": "customercare@vodacom.co.za",
        "whatsapp": "082 1958",
        "website": "https://www.vodacom.co.za/support",
        "live_chat": "https://www.vodacom.co.za/support/chat",
        "social_media": {
            "twitter": "@VodacomZA",
            "facebook": "VodacomSA"
        }
    },
    "telkom": {
        "name": "Telkom",
        "support_phone": "10210",
        "support_email": "customercare@telkom.co.za",
        "whatsapp": "065 775 0505",
        "website": "https://www.telkom.co.za/support",
        "live_chat": "https://www.telkom.co.za/support/chat",
        "social_media": {
            "twitter": "@TelkomZA",
            "facebook": "TelkomSA"
        }
    },
    "rain": {
        "name": "Rain",
        "support_phone": "087 820 7246",
        "support_email": "support@rain.co.za",
        "whatsapp": "087 820 7246",
        "website": "https://rain.co.za/support",
        "live_chat": "https://rain.co.za/support/chat",
        "social_media": {
            "twitter": "@Rain_SA",
            "facebook": "RainSouthAfrica"
        }
    },
    "mtn": {
        "name": "MTN",
        "support_phone": "135",
        "support_email": "customercare@mtn.co.za",
        "whatsapp": "083 173 3731",
        "website": "https://www.mtn.co.za/support",
        "live_chat": "https://www.mtn.co.za/support/chat",
        "social_media": {
            "twitter": "@MTNza",
            "facebook": "MTNSouthAfrica"
        }
    },
    "cell_c": {
        "name": "Cell C",
        "support_phone": "084 140",
        "support_email": "care@cellc.co.za",
        "whatsapp": "074 135 1000",
        "website": "https://www.cellc.co.za/support",
        "live_chat": "https://www.cellc.co.za/support/chat",
        "social_media": {
            "twitter": "@CellC",
            "facebook": "CellCSA"
        }
    },
    "webafrica": {
        "name": "WebAfrica",
        "support_phone": "087 700 0200",
        "support_email": "support@webafrica.co.za",
        "whatsapp": "087 700 0200",
        "website": "https://www.webafrica.co.za/support",
        "live_chat": "https://www.webafrica.co.za/support/chat",
        "social_media": {
            "twitter": "@WebAfrica",
            "facebook": "WebAfricaISP"
        }
    },
    "openserve": {
        "name": "Openserve",
        "support_phone": "10210",
        "support_email": "support@openserve.co.za",
        "whatsapp": "065 775 0505",
        "website": "https://www.openserve.co.za/support",
        "live_chat": "https://www.openserve.co.za/support/chat",
        "social_media": {
            "twitter": "@OpenserveSA",
            "facebook": "OpenserveSA"
        }
    },
    "unknown": {
        "name": "Unknown ISP",
        "support_phone": "Contact your ISP directly",
        "support_email": "Check your ISP's website",
        "whatsapp": "Not available",
        "website": "Check your router/modem documentation",
        "live_chat": "Not available",
        "social_media": {
            "twitter": "Not available",
            "facebook": "Not available"
        }
    }
}

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="admin",
        database="isp_db"
    )

def get_public_ip():
    """Get the public IP address of the user"""
    try:
        response = requests.get('https://api.ipify.org?format=json', timeout=5)
        return response.json()['ip']
    except:
        return None

def detect_isp(ip_address):
    """Detect ISP based on IP address using IP geolocation"""
    if not ip_address:
        return "unknown"
    
    try:
        # Using ip-api.com for ISP detection (free tier)
        response = requests.get(f'http://ip-api.com/json/{ip_address}?fields=isp,org', timeout=5)
        data = response.json()
        
        isp_name = data.get('isp', '').lower()
        org_name = data.get('org', '').lower()
        
        # Check for known South African ISPs
        if 'afrihost' in isp_name or 'afrihost' in org_name:
            return 'afrihost'
        elif 'vodacom' in isp_name or 'vodacom' in org_name:
            return 'vodacom'
        elif 'telkom' in isp_name or 'telkom' in org_name:
            return 'telkom'
        elif 'rain' in isp_name or 'rain' in org_name:
            return 'rain'
        elif 'mtn' in isp_name or 'mtn' in org_name:
            return 'mtn'
        elif 'cell c' in isp_name or 'cellc' in isp_name or 'cell c' in org_name or 'cellc' in org_name:
            return 'cell_c'
        elif 'webafrica' in isp_name or 'webafrica' in org_name:
            return 'webafrica'
        elif 'openserve' in isp_name or 'openserve' in org_name:
            return 'openserve'
        else:
            return 'unknown'
            
    except Exception as e:
        print(f"Error detecting ISP: {e}")
        return 'unknown'

def assess_connection_quality(ping, download_speed, upload_speed):
    """Assess the quality of internet connection and provide recommendations"""
    issues = []
    recommendations = []
    overall_quality = "good"
    
    # Ping assessment
    if ping > 100:
        issues.append("High latency detected")
        recommendations.append("High ping may cause issues with gaming and video calls")
        overall_quality = "poor"
    elif ping > 50:
        issues.append("Moderate latency")
        recommendations.append("Ping is acceptable but may affect real-time applications")
        if overall_quality == "good":
            overall_quality = "fair"
    
    # Download speed assessment
    if download_speed < 5:
        issues.append("Very slow download speed")
        recommendations.append("Download speed is too low for HD streaming and large file downloads")
        overall_quality = "poor"
    elif download_speed < 25:
        issues.append("Below average download speed")
        recommendations.append("Download speed may struggle with 4K streaming and multiple device usage")
        if overall_quality == "good":
            overall_quality = "fair"
    
    # Upload speed assessment  
    if upload_speed < 1:
        issues.append("Very slow upload speed")
        recommendations.append("Upload speed is too low for video calls and cloud backups")
        overall_quality = "poor"
    elif upload_speed < 5:
        issues.append("Below average upload speed")
        recommendations.append("Upload speed may affect video conferencing quality")
        if overall_quality == "good":
            overall_quality = "fair"
    
    return {
        "quality": overall_quality,
        "issues": issues,
        "recommendations": recommendations,
        "should_contact_support": overall_quality in ["poor", "fair"] and len(issues) >= 2
    }

@app.route('/speedtest', methods=['GET'])
def run_speed_test():
    try:
        # Get public IP and detect ISP
        public_ip = get_public_ip()
        detected_isp = detect_isp(public_ip)
        
        st = speedtest.Speedtest()
        st.get_best_server()
        download_speed = st.download() / 1_000_000  # Convert to Mbps
        upload_speed = st.upload() / 1_000_000  # Convert to Mbps
        ping = st.results.ping
        timestamp = datetime.now()
        
        # Assess connection quality
        quality_assessment = assess_connection_quality(ping, download_speed, upload_speed)
        
        # Get ISP contact information
        isp_info = ISP_CONTACTS.get(detected_isp, ISP_CONTACTS["unknown"])

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO speed_tests (ping, download_speed, upload_speed, timestamp, isp_detected, quality_assessment)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (ping, download_speed, upload_speed, timestamp, detected_isp, quality_assessment["quality"]))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "ping": ping,
            "download_speed": download_speed,
            "upload_speed": upload_speed,
            "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            "public_ip": public_ip,
            "detected_isp": detected_isp,
            "isp_info": isp_info,
            "quality_assessment": quality_assessment
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

@app.route('/isp-info/<isp_name>', methods=['GET'])
def get_isp_info(isp_name):
    """Get specific ISP contact information"""
    isp_info = ISP_CONTACTS.get(isp_name.lower(), ISP_CONTACTS["unknown"])
    return jsonify(isp_info), 200

@app.route('/detect-isp', methods=['GET'])
def detect_current_isp():
    """Detect current ISP without running speed test"""
    try:
        public_ip = get_public_ip()
        detected_isp = detect_isp(public_ip)
        isp_info = ISP_CONTACTS.get(detected_isp, ISP_CONTACTS["unknown"])
        
        return jsonify({
            "public_ip": public_ip,
            "detected_isp": detected_isp,
            "isp_info": isp_info
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Make accessible from other devices