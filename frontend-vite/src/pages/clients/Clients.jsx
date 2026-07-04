import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/api';
import { FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import '../../styles/Clients.css';
const Client = () => {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [projectsByClient, setProjectsByClient] = useState({});
  const fetchClients = useCallback(() => {
    api.get('/clients/')
      .then((res) => {
        // Handle paginated response from BaseResourceRouter
        const clientsData = res.data?.data || res.data || [];
        setClients(clientsData);
        setFiltered(clientsData);
        // Fetch projects for each client
        if (Array.isArray(clientsData) && clientsData.length > 0) {
          const projectPromises = clientsData.map(client =>
            api.get(`/projects?client_id=${client.id}`).then(res => ({
              clientId: client.id,
              projects: res.data?.data || res.data?.projects || []
            }))
          );
          Promise.all(projectPromises).then(results => {
            const projectMap = {};
            results.forEach(({ clientId, projects }) => {
              projectMap[clientId] = projects;
            });
            setProjectsByClient(projectMap);
          });
        }
      })
      .catch((err) => {
        setError("Error loading clients");
      });
  }, []);
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFiltered(clients.filter(client =>
      client.name.toLowerCase().includes(term) ||
      client.phone.toLowerCase().includes(term)
    ));
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      api.put(`/clients/${editId}`, form)
        .then(() => {
          fetchClients();
          setEditId(null);
          setForm({ name: '', email: '', phone: '', address: '' });
        });
    } else {
      api.post('/clients/', form)
        .then(() => {
          fetchClients();
          setForm({ name: '', email: '', phone: '', address: '' });
        });
    }
  };
  const handleEdit = (client) => {
    setEditId(client.id);
    setForm({ name: client.name, email: client.email, phone: client.phone, address: client.address });
  };
  const handleDelete = (id) => {
    api.delete(`/clients/${id}`)
      .then(() => fetchClients());
  };
  const handleCancel = () => {
    setEditId(null);
    setForm({ name: '', email: '', phone: '', address: '' });
  };
  return (
    <div className="client-container main-content theme-blue-white" style={{backgroundColor: 'var(--light-blue-bg)', marginLeft: '280px'}}>
      <h2 style={{color: '#0052CC'}}>👥 Clients</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} className="client-form improved-form" style={{backgroundColor: '#f0f5ff', borderColor: '#0052CC'}}>
        <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
        <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} />
        <div className="form-actions">
          <button type="submit" className="btn-blue-white">{editId ? '✏️ Update' : '➕ Add Client'}</button>
          {editId && (
            <button type="button" onClick={handleCancel} className="cancel-btn" style={{backgroundColor: '#f0f5ff', color: '#0052CC', border: '1px solid #0052CC'}}>
              ❌ Cancel
            </button>
          )}
        </div>
      </form>
      <div className="search-bar">
        <FaSearch />
        <input type="text" placeholder="Search clients..." value={searchTerm} onChange={handleSearch} />
      </div>
      <div className="client-grid">
        {filtered.map(client => (
          <div key={client.id} className="client-card">
            <h3>{client.name}</h3>
            <p><strong>Email:</strong> {client.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {client.phone}</p>
            <p><strong>Address:</strong> {client.address}</p>
            <div className="client-actions">
              <button onClick={() => handleEdit(client)} className="btn-blue-white" style={{padding: '8px 12px', fontSize: '14px'}}><FaEdit /> Edit</button>
              <button onClick={() => handleDelete(client.id)} className="delete-btn"><FaTrash /> Delete</button>
            </div>
            {/* Related Projects */}
            {projectsByClient[client.id] && projectsByClient[client.id].length > 0 && (
              <div className="related-projects">
                <h4>🛠 Projects:</h4>
                <ul>
                  {projectsByClient[client.id].map((p) => (
                    <li key={p.id}>{p.name} ({p.status})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Client;