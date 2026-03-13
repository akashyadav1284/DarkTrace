import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestRegressor

# Hardcoded synthetic data for training the baseline isolation forest model
# Columns: PacketSize, DestinationPort, Protocol (TCP=1, UDP=2, ICMP=3)
X_train = np.array([
    [500, 80, 1],    # Normal web traffic
    [600, 443, 1],   # Normal secure web traffic
    [64, 53, 2],     # Normal DNS query
    [1000, 22, 1],   # Normal SSH
    [450, 80, 1],
    [540, 443, 1],
    [1500, 8080, 1],
    [1200, 3306, 1],
    [48, 53, 2],
    [64, 80, 1]
])

# Initialize and fit the Isolation Forest model on startup
clf = IsolationForest(n_estimators=100, max_samples='auto', contamination=0.1, random_state=42)
clf.fit(X_train)

def detect_anomaly(features, packet_size, port):
    """
    Predict anomaly score and classify threat level.
    """
    # Prediction: 1 for normal, -1 for anomaly
    prediction = clf.predict(features)[0]
    
    # Decision function returns anomaly score (lower means more anomalous)
    # We invert it and normalize so 0-100 where 100 is highly anomalous
    raw_score = clf.decision_function(features)[0]
    
    # Convert raw_score (~ -0.5 to 0.5) to a 0-100 scale (approximate heuristic)
    score_normalized = max(0, min(100, float((-raw_score + 0.5) * 100)))

    # Classification logic based on prediction and specific known attack heuristics
    classification = "Normal"
    threat_level = int(score_normalized)

    if prediction == -1:
        # Determine specific attack type heuristics
        if packet_size > 5000:
            classification = "Malicious" 
            # Potential DDoS / Large payload
            threat_level = max(threat_level, 90)
        elif port in [21, 23, 25, 445, 3389]:
            # Unusual port exposure
            classification = "Suspicious"
            threat_level = max(threat_level, 65)
        else:
            classification = "Suspicious"
            threat_level = max(threat_level, 50)
    else:
        # Normal traffic can occasionally look slightly irregular
        threat_level = min(threat_level, 20)
        classification = "Normal"
        
    return abs(threat_level), classification, abs(threat_level)

# Predictive Model (Random Forest) for trend forecasting
# Synthetic data: X = [hour_of_day, traffic_volume], y = [threat_probability]
X_rf_train = np.array([
    [0, 100], [4, 50], [8, 500], [12, 800], [16, 600], [20, 300], [23, 150],
    # Adding anomalous high threat scenarios
    [2, 2000], [14, 5000], [18, 10000]
])
y_rf_train = np.array([5, 2, 15, 25, 20, 10, 8, 85, 95, 99]) # Threat probability 0-100

rf_model = RandomForestRegressor(n_estimators=50, random_state=42)
rf_model.fit(X_rf_train, y_rf_train)

def predict_future_trend(current_hour, current_volume):
    """
    Generate a 24-hour forecast based on the current state using Random Forest.
    """
    forecast = []
    # Predict next 24 hours
    for i in range(24):
        future_hour = (current_hour + i) % 24
        # Simulated volume fluctuation
        simulated_volume = current_volume * (1 + 0.1 * np.sin(i))
        prob = rf_model.predict([[future_hour, simulated_volume]])[0]
        
        # Add some random noise for realism
        prob = max(0, min(100, prob + np.random.normal(0, 5)))
        
        forecast.append({
            'timeOffset': f"+{i}h",
            'hour': future_hour,
            'riskProbability': round(prob, 2)
        })
    return forecast
