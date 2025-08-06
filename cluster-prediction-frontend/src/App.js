import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function CollapsibleReferences({ references }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      {/* Centered button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        {isOpen ? 'Hide References' : 'Show References'}
      </button>

      {isOpen && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ol
            style={{
              textAlign: 'left',      // ✅ Each reference text is left-aligned
              maxWidth: '600px',      // Optional: limit width for better readability
              paddingLeft: '20px'
            }}
          >
            {references.map((ref, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                {ref}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const references = [
  "Data-driven Cluster Analysis Reveals Increased Risk for Severe Insulin-deficient Diabetes in Black/African Americans. The Journal of Clinical Endocrinology & Metabolism, 2024, 00, 1–9.",
  "Diabetes Management Based on the Phenotype and Stage of the Disease: An Expert Proposal from the AGORA Diabetes Collaborative Group. J. Clin. Med. 2024, 13, 4839.",
  "A novel diabetes typology: towards precision diabetology from pathogenesis to treatment. Diabetologia (2022) 65:1770–1781.",
  "Not All Patients with Type 2 Diabetes Are Equal. The American Journal of Medicine, 2021; 134 (6): 707-709.",
  "Trajectories of clinical characteristics, complications and treatment choices in data-driven subgroups of type 2 diabetes. Diabetologia (2024) 67:1343–1355.",
  "Precision subclassification of type 2 diabetes: a systematic review. Communications Medicine, 2023; 3:138.",
  "Pharmacologic Approaches to Glycemic Treatment: Standards of Care in Diabetes—2024. Diabetes Care 2024;47(Suppl. 1):S158–S178."
];

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
  const [isVerified, setIsVerified] = useState(false);
  const [currentMedications, setCurrentMedications] = useState({
    insulin: false,
    glp1rAgonist: false,
    sglt2Inhibitor: false,
    metformin: false,
    other: false,
    none: false,
  });

  const clusterExplanations = {
    SAID: (
      <>The data provided and the presence of GAD-autoantibodies suggest <strong>Severe Auto-Immune Diabetes (SAID)</strong> and thus<strong> Type 1 Diabetes</strong>. These patients are prone to microvascular complications and are at an elevated risk of DKA. Early and aggressive insulin therapy should be considered, and the use of SGLT2 inhibitors is potentially unsafe.
      <CollapsibleReferences references={references} />
      </>
    ),
    SIDD: (
      <>The data provided including high HbA1c and relatively low C-peptide suggest <strong>Severe Insulin-Deficient Diabetes (SIDD)</strong> indicating loss of beta cell function. These patients are at high risk for micro- and macrovascular complications and DKA. Aggressive glucose control is indicated. Insulin secretagogues including incretin-based therapies should be considered, and early treatment with insulin might be needed and beneficial. SGLT2 inhibitors may also be considered in those with heart or kidney disease, but their use must be carefully weighed against the risk of DKA and closely monitored.
      <CollapsibleReferences references={references} />
      </>
    ),
    SIRD: (
      <>The data provided including a relatively high C-peptide suggest <strong>Severe Insulin-Resistant Diabetes (SIRD)</strong>. These patients are at high risk for complications, particularly nephropathy, MAFLD, and CVD. Aggressive glucose control is indicated. Early treatment with SGLT2 inhibitors or GLP1 RAs as well as adjuvant therapy with metformin should be considered. Insulin would typically be only required later in the disease process.
      <CollapsibleReferences references={references} />
      </>
    ),
    MOD: (
      <>The data provided indicating a relatively high body mass index suggest <strong>Mild Obesity-related Diabetes (MOD)</strong>. These patients as less prone to complications. Weight loss with diet and exercise are of most importance. Metformin, SGLT2 inhibitors, and GLP1 RAs might be beneficial as first line pharmacological therapies.
      <CollapsibleReferences references={references} />
      </>
    ),
    MARD: (
      <>The data provided including a higher age at diagnosis suggest <strong>Mild Age-Related Diabetes (MARD)</strong>. The risk for complications is relatively lower. A more conservative therapeutic approach with safer drugs might be appropriate.
      <CollapsibleReferences references={references} />
      </>
    ) 
  };
  
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
    insulin: '  Insulin',
    glp1rAgonist: '  GLP-1 Receptor Agonist',
    sglt2Inhibitor: '  SGLT2 Inhibitor',
    metformin: '  Metformin',
    other: '  Other',
    none: '  None'
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
  
    // Update the state of current medications
    setCurrentMedications((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleFutureMedicationChange = (e) => {
    const { name, checked } = e.target;
  
    // Update the state of future medications
    setFutureMedications((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResult(null);

    // Check if the verification checkbox is checked
    if (!isVerified) {
      setErrorMessage('Please verify that you are entering real patient information.');
    return;
  }

    if (!Object.values(currentMedications).some((checked) => checked)) {
      setErrorMessage('Please select the patient\'s current medication(s).');
      return;
    }

    // Check if "None" and other medications are selected simultaneously
    if (
      currentMedications.none &&
      Object.entries(currentMedications).some(([key, checked]) => key !== 'none' && checked)
    ) {
      setErrorMessage('You cannot select "None" along with other medications.');
      return;
    }

    if (!inputs.gad || !inputs.hba1c || !inputs.bmi || !inputs.age || !inputs.cpeptide || !inputs.glucose) {
      setErrorMessage('All fields must be filled with valid values.');
      return;
    }

    if (!glucoseUnit || !cpeptideUnit) {
      setErrorMessage('Please select units for glucose and C-peptide.');
      return;
    }

    try {
      let glucoseValue = parseFloat(inputs.glucose);
      let cpeptideValue = parseFloat(inputs.cpeptide);

      if (glucoseUnit === 'mg/dL') {
        glucoseValue = glucoseValue / 18.0182;
      }

      if (cpeptideUnit === 'ng/mL') {
        cpeptideValue = cpeptideValue * 0.3311;
      }

      const someInputs = {
        gad: inputs.gad === 'Positive' ? 1 : 0,
        hba1c: parseFloat(inputs.hba1c),
        bmi: parseFloat(inputs.bmi),
        age: parseFloat(inputs.age),
        cpeptide: cpeptideValue,
        glucose: glucoseValue,
        medications: currentMedications, 
        isVerified: isVerified
      };

      // Send the request to the prediction endpoint  
      const response = await axios.post(`${API_URL}/predict`, someInputs);
      
      // Check if we have a successful response and handle it
      if (response.data) {
        // Store the entire result
        setResult(response.data);
        // Store the prediction ID explicitly using the updated key name
        setResult((prev) => ({ ...prev, predictionId: response.data.predictionId }));
      }

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
   
    if (isManagementChanged === 'yes' && !Object.values(futureMedications).some((checked) => checked)) {
      setMedicationError('Please select at least one medication going forward.');
      return;
    }
  
    // Check if "None" is selected alongside other medications
    if (
      futureMedications.none &&
      Object.entries(futureMedications).some(([key, checked]) => key !== 'none' && checked)
    ) {
      setMedicationError('You cannot select "None" along with other medications.');
      return;
    }

    setMedicationError(''); // Clear any previous error messages
  
    try {
      // Ensure we have a prediction ID
      if (!result || !result.predictionId) {
        setSubmissionStatus('Failed to submit. Prediction ID is missing.');
        return;
      }
  
      // Submit medications regardless of management change
      let medicationsToSubmit = isManagementChanged === 'yes' ? futureMedications : null;
  
      const response = await axios.post(`${API_URL}/submit_medications`, {
        predictionId: result.predictionId,
        isManagementChanged: isManagementChanged,
        medications: medicationsToSubmit,
      });
  
      setSubmissionStatus('Saved successfully.');
    } catch (error) {
      console.error('Error:', error);
      setSubmissionStatus('Failed to submit. Please try again.');
    }
  };
  
  return (
    <div className="app-container">
      <div className="form-container">
        <h2>Diabetes Cluster Prediction</h2>
        <p style={{ marginBottom: '20px' }}>
          <ul style={{ paddingLeft: '20px' }}>
            <li>This tool should not be used for monogenic forms of diabetes.</li>
            <li>After predicting the cluster, please continue to scroll down and complete the rest of the form. By the end, you will have clicked two blue buttons.</li>
            <li>If you need to correct an entry, please contact:&nbsp; <a href="mailto:anmichl@uabmc.edu">anmichl@uabmc.edu</a>.</li>
            <li>The model has an average sensitivity of 93% and specificity of 98%.</li>
          </ul> 
        </p>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold' }}>
            <input 
              type="checkbox" 
              checked={isVerified} 
              onChange={(e) => setIsVerified(e.target.checked ? true:false)} 
              required 
              style={{ marginRight: '8px' }}
            />
            I verify that I am entering real patient information.
        </label>
      </div>
        <div>
          <label className="current-medications-label">Current Medication(s):</label>
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
        
        <p style={{ marginBottom: '20px' }}>
        Next, please enter all values as recorded at the time or closest to the patient’s <b>initial diabetes diagnosis</b>.
        </p>

        <form onSubmit={handleSubmit} className="prediction-form">
          <div className="input-group">
            <label>GAD antibodies:</label>
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
            <label> HbA1c (%):</label>
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
            <label>Age (years):</label>
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
                <option value="ng/mL">ng/mL</option> 
                <option value="nmol/L">nmol/L</option>
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
        
        <p style={{ marginBottom: '20px' }}>
        After predicting the cluster, please continue to scroll all the way down and complete the remainder of the form. 
        </p>

        {result && (
          <div className="result-container">
            {/* Display the resulting cluster */}
            <h3>Prediction Result</h3>
            <p><strong>Predicted Cluster:</strong> {result.cluster_label}</p>

            {/* Display the explanation for the cluster */}
            <div className="explanation-box" style={{ marginTop: '20px' }}>
              <h4>Cluster Explanation:</h4>
              {clusterExplanations[result.cluster_label] || (
                <p>No explanation available for this cluster.</p>
              )}
            </div>

            {/* Display the probabilities */}
            <div style={{ marginTop: '20px' }}>
              <p><strong>Probabilities:</strong></p>
              <div>SAID: {(result.probabilities[0] * 100).toFixed(2)}%</div>
              <div>SIDD: {(result.probabilities[1] * 100).toFixed(2)}%</div>
              <div>SIRD: {(result.probabilities[2] * 100).toFixed(2)}%</div>
              <div>MOD: {(result.probabilities[3] * 100).toFixed(2)}%</div>
              <div>MARD: {(result.probabilities[4] * 100).toFixed(2)}%</div>
            </div>

            {/* Display "Is this prediction going to change your management?" */}
            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              <p><strong> Is this prediction going to change your management?</strong></p>
              <label>
                <input 
                  type="radio" 
                  name="isManagementChanged" 
                  value="yes" 
                  onChange={() => setIsManagementChanged('yes')} 
                  style={{ marginRight: '2px' }} 
                />
                Yes  
              </label>
              <label style={{ marginLeft: '8px' }}> 
                <input 
                  type="radio" 
                  name="isManagementChanged" 
                  value="no" 
                  onChange={() => setIsManagementChanged('no')}
                  style={{ marginRight: '2px' }} // Add spacing  
                />
                No
              </label>
            </div>
            {(isManagementChanged === 'yes' || isManagementChanged === 'no') && (
              <div style={{ marginTop: '20px', textAlign: 'left'}}>
                {isManagementChanged === 'yes' && (
                  <div>
                    <p style={{ marginRight: '10px' }}> 
                    <strong>Medication(s) going forward after this visit: </strong> 
                    </p>  
                    {Object.keys(futureMedications).map((medication) => (
                      <div key={medication} style={{ textAlign: 'left' }}>
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
                  Save to database
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