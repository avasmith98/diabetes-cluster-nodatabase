
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:5000' // Local Flask server
    : 'https://diabetes-cluster-b062f200dfdc.herokuapp.com/'; // Deployed Flask server

function App() {
  const [inputs, setInputs] = useState({
    gad: '',
    hba1c: '',
    bmi: '',
    age: '',
    cpeptide: '',
    glucose: ''
  });
  const [glucoseUnit, setGlucoseUnit] = useState('');
  const [cpeptideUnit, setCpeptideUnit] = useState('');
  const [currentMedications, setCurrentMedications] = useState({
    insulin: false,
    glp1rAgonist: false,
    sglt2Inhibitor: false,
    metformin: false,
    other: false,
    none: false,
  });
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isManagementChanged, setIsManagementChanged] = useState('');
  const [futureMedications, setFutureMedications] = useState({
    insulin: false,
    glp1rAgonist: false,
    sglt2Inhibitor: false,
    metformin: false,
    other: false,
    none: false,
  });
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [medicationError, setMedicationError] = useState('');

  // Define labels for medication keys
  const medicationLabels = {
    insulin: 'Insulin',
    glp1rAgonist: 'GLP-1 Receptor Agonist',
    sglt2Inhibitor: 'SGLT2 Inhibitor',
    metformin: 'Metformin',
    other: 'Other',
    none: 'None'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "glucose" || name === "cpeptide") {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setInputs({ ...inputs, [name]: value });
      }
    } else {
      setInputs({ ...inputs, [name]: value });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setCurrentMedications((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFutureMedicationChange = (e) => {
    const { name, checked } = e.target;
    setFutureMedications((prev) => ({ ...prev, [name]: checked }));
    setMedicationError(''); // Clear any previous error message
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResult(null);

    if (!inputs.gad || !inputs.hba1c || !inputs.bmi || !inputs.age || !inputs.cpeptide || !inputs.glucose) {
      setErrorMessage('All fields must be filled with valid values.');
      return;
    }

    if (!glucoseUnit || !cpeptideUnit) {
      setErrorMessage('Please select units for glucose and C-peptide.');
      return;
    }

    if (!Object.values(currentMedications).some((checked) => checked)) {
      setErrorMessage('Please select the patient\'s current medications.');
      return;
    }

    try {
      let glucoseValue = parseFloat(inputs.glucose);
      let cpeptideValue = parseFloat(inputs.cpeptide);

      if (glucoseUnit === 'mg/dL') {
        glucoseValue = glucoseValue / 18;
      }

      if (cpeptideUnit === 'ng/mL') {
        cpeptideValue = cpeptideValue * 0.333;
      }

      const numericInputs = {
        gad: inputs.gad === 'Positive' ? 1 : 0,
        hba1c: parseFloat(inputs.hba1c),
        bmi: parseFloat(inputs.bmi),
        age: parseFloat(inputs.age),
        cpeptide: cpeptideValue,
        glucose: glucoseValue,
        medications: currentMedications, 
      };

      const response = await axios.post(`${API_URL}/predict`, numericInputs);
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(`Server Error: ${error.response.data.error}`);
      } else if (error.response && error.response.status === 400) {
        setErrorMessage('The input values are out of range. Please enter valid values within the accepted range.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again later.');
      }
    }
  };

  const handleMedicationSubmit = async () => {
    if (isManagementChanged === 'yes' && !Object.values(futureMedications).some(checked => checked)) {
      setMedicationError('Please select at least one medication going forward.');
    } else {
      setMedicationError('');
  
      try {
        const response = await axios.post(`${API_URL}/submit_medications`, {
          isManagementChanged: isManagementChanged,
          medications: futureMedications,
        });
  
        setSubmissionStatus('Saved successfully.');
      } catch (error) {
        console.error('Error:', error);
        setSubmissionStatus('Failed to submit. Please try again.');
      }
    }
  };
  

  return (
    <div className="app-container">
      <div className="form-container">
        <h2>Diabetes Cluster Prediction</h2>
        <p style={{ marginBottom: '20px' }}>This app should not be used for monogenic forms of diabetes. This prediction model has an average sensitivity of 93% and specificity of 98%.</p>
        
        <div>
          <label className="current-medications-label">Current Medications:</label>
          {Object.keys(currentMedications).map((medication) => (
            <div key={medication} className={medication === 'none' ? 'last-medication-option' : ''}>
              <label className="medication-label">
                <input 
                  type="checkbox" 
                  name={medication} 
                  checked={currentMedications[medication]} 
                  onChange={handleCheckboxChange} 
                />
                {medicationLabels[medication]}
              </label>
            </div>
          ))}
        </div>

        <p style={{ marginBottom: '20px' }}>Next, please enter all values as recorded at the time or closest to the patient’s initial diabetes diagnosis.</p>
        
        <form onSubmit={handleSubmit} className="prediction-form">
          <div className="input-group">
            <label>GAD Antibodies:</label>
            <select 
              name="gad" 
              value={inputs.gad} 
              onChange={handleChange} 
              required
              className={inputs.gad === '' ? 'placeholder' : 'valid'}
            >
              <option value="" disabled hidden>Select GAD Status</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
            </select>
          </div>

          <div className="input-group">
            <label>HbA1c (%):</label>
            <input 
              type="number" 
              name="hba1c" 
              value={inputs.hba1c} 
              onChange={handleChange} 
              placeholder="HbA1c (%)" 
              required 
            />
          </div>

          <div className="input-group">
            <label>BMI (kg/m²):</label>
            <input 
              type="number" 
              name="bmi" 
              value={inputs.bmi} 
              onChange={handleChange} 
              placeholder="BMI (kg/m²)" 
              required 
            />
          </div>

          <div className="input-group">
            <label>Age (Years):</label>
            <input 
              type="number" 
              name="age" 
              value={inputs.age} 
              onChange={handleChange} 
              placeholder="Age (Years)" 
              required 
            />
          </div>

          <div className="input-group">
            <label>C-peptide:</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="number" 
                name="cpeptide" 
                value={inputs.cpeptide} 
                onChange={handleChange} 
                placeholder="C-peptide" 
                required 
                style={{ width: '55%' }}
              />
              <select 
                name="cpeptideUnit" 
                value={cpeptideUnit} 
                onChange={(e) => setCpeptideUnit(e.target.value)}
                required
                className={cpeptideUnit === '' ? 'placeholder' : 'valid'}
                style={{ width: '45%' }}
              >
                <option value="" disabled hidden>Select Unit</option>
                <option value="nmol/L">nmol/L</option>
                <option value="ng/mL">ng/mL</option> 
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Glucose:</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="number" 
                name="glucose" 
                value={inputs.glucose} 
                onChange={handleChange} 
                placeholder="Glucose" 
                required 
                style={{ width: '55%' }}
              />
              <select 
                name="glucoseUnit" 
                value={glucoseUnit} 
                onChange={(e) => setGlucoseUnit(e.target.value)}
                required
                className={glucoseUnit === '' ? 'placeholder' : 'valid'}
                style={{ width: '45%' }}
              >
                <option value="" disabled hidden>Select Unit</option>
                <option value="mg/dL">mg/dL</option>
                <option value="mmol/L">mmol/L</option> 
              </select>
            </div>
          </div>

          <button type="submit" className="submit-button">Predict and save to database</button>
        </form>

        {errorMessage && (
          <div className="error-message">
            <p>{errorMessage}</p>
          </div>
        )}

        {result && (
          <div className="result-container">
            <h3>Prediction Result</h3>
            <p><strong>Predicted Cluster:</strong> {result.cluster_label}</p>
            <p><strong>Probabilities:</strong></p>
            <div>SAID: {(result.probabilities[0] * 100).toFixed(2)}%</div>
            <div>SIDD: {(result.probabilities[1] * 100).toFixed(2)}%</div>
            <div>SIRD: {(result.probabilities[2] * 100).toFixed(2)}%</div>
            <div>MOD: {(result.probabilities[3] * 100).toFixed(2)}%</div>
            <div>MARD: {(result.probabilities[4] * 100).toFixed(2)}%</div>

            <div style={{ marginTop: '20px' }}>
              <p> <strong> Is this prediction going to change your management? </strong> </p>
              <label>
                <input 
                  type="radio" 
                  name="isManagementChanged" 
                  value="yes" 
                  onChange={() => setIsManagementChanged('yes')} 
                />
                Yes
              </label>
              <label>
                <input 
                  type="radio" 
                  name="isManagementChanged" 
                  value="no" 
                  onChange={() => setIsManagementChanged('no')} 
                />
                No
              </label>
            </div>

            {(isManagementChanged === 'yes' || isManagementChanged === 'no') && (
              <div style={{ marginTop: '20px' }}>
                {isManagementChanged === 'yes' && (
                  <div>
                    <p> <strong>Medication going forward after this visit: </strong> </p> 
                    {Object.keys(futureMedications).map((medication) => (
                      <div key={medication}>
                        <label>
                          <input 
                            type="checkbox" 
                            name={medication} 
                            checked={futureMedications[medication]} 
                            onChange={handleFutureMedicationChange} 
                          />
                          {medicationLabels[medication]}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {medicationError && (
                  <div className="error-message">
                    <p>{medicationError}</p>
                  </div>
                )}

                <button 
                  type="button" 
                  className="submit-button" 
                  onClick={handleMedicationSubmit}
                  disabled={isManagementChanged === 'yes' && !Object.values(futureMedications).some(checked => checked)}
                >
                  Submit to database
                </button>
                
                {submissionStatus && (
                  <div className="submission-status">
                    <p>{submissionStatus}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
