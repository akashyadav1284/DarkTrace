from flask import Flask, request, jsonify
from flask_cors import CORS
from model import detect_anomaly, predict_future_trend
import datetime

app = Flask(__name__)
CORS(app)

@app.route('/detect-threat', methods=['POST'])
def detect_threat():
    try:
        data = request.json
        packet_size = data.get('packetSize', 0)
        port = data.get('destinationPort', 80)
        protocol = data.get('protocol', 'TCP')
        
        # Determine threat mapping based on protocol string
        proto_map = {'TCP': 1, 'UDP': 2, 'ICMP': 3}
        protocol_num = proto_map.get(protocol.upper(), 0)

        # Basic numeric feature array for Isolation Forest
        # Format: [packetSize, destinationPort, protocol]
        features = [[packet_size, port, protocol_num]]

        # Run anomaly detection
        anomaly_score, classification, threat_level = detect_anomaly(features, packet_size, port)

        return jsonify({
            'anomalyScore': anomaly_score,
            'classification': classification,
            'threatLevel': threat_level
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/insights', methods=['GET'])
def get_insights():
    # Mocking some model metrics since we're using a pre-trained/simple Isolation Forest
    return jsonify({
        'modelName': 'Isolation Forest (Cyber Threat)',
        'accuracy': 94.2,
        'precision': 91.8,
        'recall': 89.5,
        'f1Score': 90.6,
        'totalAnalyzed': 124590,
        'threatsDetected': 8932,
        'featureImportance': [
            {'feature': 'Destination Port', 'importance': 0.45},
            {'feature': 'Packet Size', 'importance': 0.35},
            {'feature': 'Protocol', 'importance': 0.20}
        ],
        'recentAnomalies': [
            {'timestamp': '10 mins ago', 'score': 98.5, 'type': 'Port Scan'},
            {'timestamp': '22 mins ago', 'score': 85.2, 'type': 'Data Exfiltration'},
        ]
    })

@app.route('/api/ml/predict-trend', methods=['GET'])
def get_predict_trend():
    try:
        current_hour = datetime.datetime.now().hour
        # Default mock volume or read from request args
        current_volume = int(request.args.get('volume', 1000))
        
        forecast = predict_future_trend(current_hour, current_volume)
        
        # Mock high-risk IPs
        high_risk_ips = [
            {'ip': '185.220.101.45', 'reason': 'Repeated DDoS patterns', 'probability': 89},
            {'ip': '45.133.1.100', 'reason': 'Port Scanning Sweep', 'probability': 76},
            {'ip': '193.161.193.99', 'reason': 'Known Malware C&C', 'probability': 94}
        ]

        return jsonify({
            'forecast': forecast,
            'highRiskIPs': high_risk_ips
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
