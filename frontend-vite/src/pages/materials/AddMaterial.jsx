import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // For handling URL params
import { Button, TextField, Grid, Container, Typography, FormHelperText, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import api from '../../api/api';  // API configuration
import '../../styles/AddMaterial.css';
const AddMaterial = () => {
  const { id } = useParams();  // Get the material ID from the URL (if editing)
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    price: '',
    unit_of_measurement: '',
    project_id: '', // For dropdown selection
  });
  const [projects, setProjects] = useState([]);  // State to hold the list of projects
  const [error, setError] = useState(null); // Error state
  const [success, setSuccess] = useState(null); // Success state
  // Fetch projects on component mount
  useEffect(() => {
    api.get('/api/projects')
      .then((response) => {
        if (Array.isArray(response.data)) {
          setProjects(response.data); // Store the fetched projects if it's an array
        } else {
          setError('Failed to load projects: Invalid data format.');
        }
      })
      .catch((error) => {
        setError('Failed to load projects. Please try again later.');
      });
    // If editing an existing material, fetch its details
    if (id) {
      api.get(`/api/materials/${id}`)
        .then((response) => {
          setFormData(response.data);  // Pre-fill form with material data
        })
        .catch((error) => {
          setError('Failed to load material details.');
        });
    }
  }, [id]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation for required fields
    if (!formData.name || !formData.quantity || !formData.price || !formData.project_id) {
      setError('Please fill in all required fields.');
      return;
    }
    // Clear previous error
    setError(null);
    const request = id
      ? api.put(`/api/materials/${id}`, formData) // Edit material if ID exists
      : api.post('/api/materials', formData); // Add new material if no ID
    // Submit the material data to the backend
    request
      .then((response) => {
        setSuccess('Material saved successfully!');
        // Clear the form after successful submission if adding
        if (!id) {
          setFormData({
            name: '',
            description: '',
            quantity: '',
            price: '',
            unit_of_measurement: '',
            project_id: '',
          });
        }
      })
      .catch((error) => {
        setError('An error occurred while saving the material.');
      });
  };
  return (
    <Container maxWidth="sm" className="project-details">
      <Typography variant="h4" component="h1" gutterBottom>
        {id ? 'Edit Material' : 'Add Material'}
      </Typography>
      {/* Error and Success messages */}
      {error && <FormHelperText error>{error}</FormHelperText>}
      {success && <FormHelperText sx={{ color: 'green' }}>{success}</FormHelperText>}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Material Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Unit of Measurement"
              name="unit_of_measurement"
              value={formData.unit_of_measurement}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          {/* Dropdown for Project Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="">
                    <em>No Projects Available</em>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit" fullWidth>
              {id ? 'Update Material' : 'Add Material'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};
export default AddMaterial;
