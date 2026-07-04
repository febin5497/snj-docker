import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { FaSave, FaTimes, FaUpload, FaCheckCircle } from 'react-icons/fa';
import '../../styles/ProjectForm.css';
const ProjectForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showError } = useToast();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    name: '',
    location: '',
    start_date: '',
    rate_per_sqft: '',
    square_feet: '',
    status: 'Planned',
    client_id: ''
  });
  const [clients, setClients] = useState([]);
  const [documents, setDocuments] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    mobile: '',
    email: ''
  });
  const documentTypes = [
    { id: 'Agreement', label: 'Agreement', icon: '📄' },
    { id: 'PLAN', label: 'Floor Plan', icon: '📐' },
    { id: '3D Plan', label: '3D Plan', icon: '🎨' },
    { id: 'Panchayat Certificate', label: 'Panchayat Certificate', icon: '✓' },
  ];
  useEffect(() => {
    api.get('/clients/')
      .then(res => {
        // Ensure clients is an array
        const clientsList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.clients || []);
        setClients(clientsList);
      })
      .catch(err => {
        setError("Failed to load clients");
      });
    if (isEdit) {
      api.get(`/api/projects/${id}`)
        .then(res => {
          const projectData = res.data?.data || res.data;
          setForm({
            name: projectData.name || '',
            location: projectData.location || '',
            start_date: projectData.start_date || '',
            rate_per_sqft: projectData.rate_per_sqft || '',
            square_feet: projectData.square_feet || '',
            status: projectData.status || 'Planned',
            client_id: projectData.client_id || ''
          });
        })
        .catch((err) => {
          setError("Failed to load project: " + (err.response?.data?.error || err.message));
        });
    }
  }, [id, isEdit]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
  };
  const handleFileChange = (docType, file) => {
    if (file) {
      setDocuments({ ...documents, [docType]: file });
      setUploadedDocs({ ...uploadedDocs, [docType]: true });
    }
  };
  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) {
      setError("Client name is required");
      return;
    }
    if (!newClient.mobile.trim()) {
      setError("Mobile number is required");
      return;
    }
    if (!newClient.email.trim()) {
      setError("Email is required");
      return;
    }
    try {
      const response = await api.post('/clients/', newClient);
      // Extract client from response (API returns { client: {...}, message: "..." })
      let createdClient = response.data.client || response.data.data || response.data.response || response.data;
      // Ensure we have all required fields
      const clientWithAllFields = {
        id: createdClient.id,
        name: createdClient.name || newClient.name,
        phone: createdClient.phone || createdClient.mobile || newClient.mobile,
        email: createdClient.email || newClient.email
      };
      // Add new client to the list
      setClients([...clients, clientWithAllFields]);
      // Select the newly created client
      setForm({ ...form, client_id: clientWithAllFields.id });
      // Reset form and close
      setNewClient({ name: '', mobile: '', email: '' });
      setShowNewClientForm(false);
      setSuccess("Client created successfully! You can now continue with your project.");
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create client");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation
    if (!form.name.trim()) {
      setError("Project name is required");
      return;
    }
    if (!form.location.trim()) {
      setError("Location is required");
      return;
    }
    if (!form.start_date) {
      setError("Start date is required");
      return;
    }
    if (!form.client_id) {
      setError("Client selection is required");
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) return showError("You're not logged in.");
    try {
      const payload = { ...form };
      let projectId = id;
      if (isEdit) {
        await api.put(`/api/projects/${projectId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        const response = await api.post('/api/projects/', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        projectId = response.data.id;
      }
      // Upload files if any
      for (const [docType, file] of Object.entries(documents)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('doc_type', docType);
        await api.post(`/api/projects/${projectId}/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      setSuccess(`Project ${isEdit ? 'updated' : 'created'} successfully! Redirecting...`);
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err) {
      setError("Error saving project. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="main-content">
      <div className="form-page-header">
        <div>
          <h1>{isEdit ? '✏️ Edit Project' : '➕ Create New Project'}</h1>
          <p className="form-subtitle">{isEdit ? 'Update project details' : 'Add a new construction project'}</p>
        </div>
      </div>
      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <FaCheckCircle /> {success}
        </div>
      )}
      <div className="form-container">
        <form onSubmit={handleSubmit} className="modern-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <div className="section-header">
              <h2>📋 Basic Information</h2>
              <p>Enter the fundamental details of your project</p>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="name">
                  Project Name
                  <span className="required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Shopping Complex Alpha"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">
                  Location
                  <span className="required">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g., Downtown Area, City"
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="start_date">
                  Start Date
                  <span className="required">*</span>
                </label>
                <input
                  id="start_date"
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="client_id">
                  Client
                  <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <select
                    id="client_id"
                    name="client_id"
                    value={form.client_id}
                    onChange={handleChange}
                    className="form-input"
                    required
                    style={{ flex: 1 }}
                  >
                    <option value="">Select a Client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(!showNewClientForm)}
                    className="btn-secondary"
                    style={{ padding: '10px 15px', whiteSpace: 'nowrap' }}
                  >
                    {showNewClientForm ? '✕ Cancel' : '+ New Client'}
                  </button>
                </div>
              </div>
            </div>
            {/* New Client Form */}
            {showNewClientForm && (
              <div className="form-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h3>➕ Create New Client</h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="client_name">
                      Client Name
                      <span className="required">*</span>
                    </label>
                    <input
                      id="client_name"
                      type="text"
                      name="name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      placeholder="e.g., ABC Construction Ltd."
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="client_mobile">
                      Mobile Number
                      <span className="required">*</span>
                    </label>
                    <input
                      id="client_mobile"
                      type="tel"
                      name="mobile"
                      value={newClient.mobile}
                      onChange={(e) => setNewClient({ ...newClient, mobile: e.target.value })}
                      placeholder="e.g., 98765 43210"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="client_email">
                    Email
                    <span className="required">*</span>
                  </label>
                  <input
                    id="client_email"
                    type="email"
                    name="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="e.g., contact@example.com"
                    className="form-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateClient}
                  className="btn-primary"
                  style={{ marginTop: '15px' }}
                >
                  ✓ Create Client
                </button>
              </div>
            )}
          </div>
          {/* Project Specifications Section */}
          <div className="form-section">
            <div className="section-header">
              <h2>📐 Project Specifications</h2>
              <p>Define the scope and budget parameters</p>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="square_feet">
                  Area (Sq.ft)
                  <span className="optional">(Optional)</span>
                </label>
                <input
                  id="square_feet"
                  type="number"
                  name="square_feet"
                  value={form.square_feet}
                  onChange={handleChange}
                  placeholder="e.g., 50000"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rate_per_sqft">
                  Rate (₹/Sq.ft)
                  <span className="optional">(Optional)</span>
                </label>
                <input
                  id="rate_per_sqft"
                  type="number"
                  name="rate_per_sqft"
                  value={form.rate_per_sqft}
                  onChange={handleChange}
                  placeholder="e.g., 2500"
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group full-width">
                <label htmlFor="status">
                  Project Status
                  <span className="optional">(Optional)</span>
                </label>
                <div className="status-select-wrapper">
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="Planned">📌 Planned</option>
                    <option value="In Progress">⚙️ In Progress</option>
                    <option value="Completed">✓ Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Documents Section */}
          <div className="form-section">
            <div className="section-header">
              <h2>📁 Project Documents</h2>
              <p>Upload supporting documents for the project</p>
            </div>
            <div className="documents-grid">
              {documentTypes.map(doc => (
                <div key={doc.id} className="document-upload-card">
                  <div className="doc-icon">{doc.icon}</div>
                  <div className="doc-content">
                    <h3>{doc.label}</h3>
                    <p className="doc-hint">Upload file</p>
                  </div>
                  <div className="doc-input-wrapper">
                    <input
                      type="file"
                      id={`doc-${doc.id}`}
                      onChange={(e) => handleFileChange(doc.id, e.target.files[0])}
                      className="doc-file-input"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.glb,.gltf,.obj,.stl,.fbx,.3ds"
                    />
                    <label htmlFor={`doc-${doc.id}`} className="doc-label">
                      {uploadedDocs[doc.id] ? (
                        <>
                          <FaCheckCircle className="check-icon" />
                          <span>File Selected</span>
                        </>
                      ) : (
                        <>
                          <FaUpload />
                          <span>Choose File</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <p className="document-hint-text">
              Supported formats: PDF, DOC, DOCX, JPG, PNG, XLSX, GLB, GLTF, OBJ, STL (Max 10MB each)
            </p>
          </div>
          {/* Action Buttons */}
          <div className="form-actions-modern">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-large"
            >
              <FaSave /> {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
            </button>
            <button
              type="button"
              className="btn-secondary-large"
              onClick={() => navigate('/projects')}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProjectForm;
