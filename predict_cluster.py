
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 
import os
import joblib
import pandas as pd


# Create Flask app
app = Flask(__name__, static_folder="build")
CORS(app)  # Enable CORS for all routes


# Set up PostgreSQL database URI
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    'postgres://u8o05n5m5i3uvf:p0665b364477ccf9d7a95ae0275a52d5de5e493f0a0eaae3978f52da9b5660df1@c5p86clmevrg5s.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d85p6inov3csp6'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db = SQLAlchemy(app)


# Load model
MODEL_PATH = 'full_linear_rf_model.joblib'
if not os.path.isfile(MODEL_PATH):
    raise FileNotFoundError(f"Model file {MODEL_PATH} does not exist.")
model = joblib.load(MODEL_PATH)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get JSON data from request
        data = request.get_json()
        gad = float(data['gad'])
        hba1c = float(data['hba1c'])
        bmi = float(data['bmi'])
        age = float(data['age'])
        cpeptide = float(data['cpeptide'])
        glucose = float(data['glucose'])
    except (KeyError, ValueError):
        return jsonify({'error': 'Invalid input data'}), 400

    # Check input values are within required range
    if not ((gad == 1) or (gad == 0)):
        return jsonify({'error': 'GAD autoantibody value must be 0 (negative) or 1 (positive).'}), 400
    if not (4.7 <= hba1c <= 18.1):
        return jsonify({'error': 'HbA1c value must be between 4.7 and 18.1%.'}), 400
    if not (19 <= bmi <= 60):
        return jsonify({'error': 'BMI value must be between 19 and 60 kg/m2.'}), 400
    if not (0.2 <= cpeptide <= 3.5):
        return jsonify({'error': 'C-peptide value must be between 0.2 and 3.5 nmol/L.'}), 400
    if not (3.5 < glucose <= 25):
        return jsonify({'error': 'Glucose value must be greater than 3.5 and less than or equal to 25 mmol/L.'}), 400
    if not (18 <= age <= 88):
        return jsonify({'error': 'Age must be between 18 and 88 years.'}), 400

    # Approximate HOMA1
    homa1_b = (20 * 6 * cpeptide) / (glucose - 3.5)
    homa1_ir = (glucose * 6 * cpeptide) / 22.5

    # Construct input to match training format
    x = pd.DataFrame({
        "gad": [gad],
        "a1c": [hba1c],
        "bmi": [bmi],
        "diabetes_age": [age],
        "homa1_cpeptide_b": [homa1_b],
        "homa1_cpeptide_ir": [homa1_ir]
    })

    # Predict cluster
    cluster = model.predict(x)[0]
    cluster_prob = model.predict_proba(x)[0]

    # Round probabilities to 3 decimal places
    cluster_prob_rounded = [round(prob, 3) for prob in cluster_prob.tolist()]

    # Translate cluster number to label
    cluster_dict = {0: "SAID", 1: "SIDD", 2: "SIRD", 3: "MOD", 4: "MARD"}
    cluster_label = cluster_dict[cluster]

    # Return output
    output = {
        'cluster_label': cluster_label,
        'probabilities': cluster_prob_rounded
    }
    return jsonify(output)

# Serve React static files
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

