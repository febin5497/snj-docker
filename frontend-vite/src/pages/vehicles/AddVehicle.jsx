import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Import navigation hook
import api from '../../api/api';  // Import your API configuration
import { Button, TextField, MenuItem, FormControl, InputLabel, Select, Grid, Container, Typography, FormHelperText, Checkbox, FormControlLabel } from '@mui/material';
const AddVehicle = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    registration_number: '',
    mileage: '',
    status: 'active',
    vehicle_type: 'private',  // New vehicle type field (private/commercial)
    registration_date: '',
    pollution_date: '',
    insurance_date: '',
    tax_date: '',
    geology_certificate_date: '',  // For Commercial Tipper
    emi: false,  // EMI status
    emi_amount: '',  // EMI amount (conditional)
  });
  const [error, setError] = useState(null);  // To display error messages
  const [success, setSuccess] = useState(null);  // To display success message
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation to ensure required fields are filled
    if (!formData.make || !formData.model || !formData.year || !formData.registration_number) {
      setError('Please fill in all required fields.');
      return;
    }
    // Validate vehicle type
    if (!formData.vehicle_type) {
      setError('Please select a vehicle type.');
      return;
    }
    // Clear previous error
    setError(null);
    // Prepare the payload to match backend structure
    const payload = {
      make: formData.make,
      model: formData.model,
      year: formData.year,
      registration_number: formData.registration_number,
      mileage: formData.mileage,
      status: formData.status,
      type: formData.vehicle_type, // Ensure the correct field name
      registration_date: formData.registration_date,
      pollution_date: formData.pollution_date,
      insurance_date: formData.insurance_date,
      tax_date: formData.tax_date,
      geology_certificate_date: formData.geology_certificate_date,
      emi_status: formData.emi,
      emi_amount: formData.emi_amount,
    };
    // Send POST request to backend
    api.post('/api/vehicles/', payload)
      .then(response => {
        setSuccess('Vehicle added successfully!');
        setTimeout(() => {
          navigate('/vehicles');
        }, 2000);
      })
      .catch(error => {
        setError('An error occurred while creating the vehicle. Please try again.');
      });
  };
  return (
    <Container maxWidth="sm" sx={{ paddingTop: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Add Vehicle
      </Typography>
      {/* Error message */}
      {error && <FormHelperText error>{error}</FormHelperText>}
      {/* Success message */}
      {success && <FormHelperText sx={{ color: 'green' }}>{success}</FormHelperText>}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Year"
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Registration Number"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Mileage (km)"
              name="mileage"
              type="number"
              value={formData.mileage}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="commercial">Commercial</MenuItem>
                <MenuItem value="tipper">Commercial (Tipper)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* Conditionally show registration, pollution, and insurance date for private vehicles */}
          {formData.vehicle_type === 'private' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Registration Date"
                  type="date"
                  name="registration_date"
                  value={formData.registration_date}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Pollution Date"
                  type="date"
                  name="pollution_date"
                  value={formData.pollution_date}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Insurance Date"
                  type="date"
                  name="insurance_date"
                  value={formData.insurance_date}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
            </>
          )}
          {/* Conditionally show tax and geology fields for commercial vehicles */}
          {formData.vehicle_type === 'commercial' || formData.vehicle_type === 'tipper' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tax Date"
                  type="date"
                  name="tax_date"
                  value={formData.tax_date}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              {formData.vehicle_type === 'tipper' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Geology Certificate Date"
                    type="date"
                    name="geology_certificate_date"
                    value={formData.geology_certificate_date}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
              )}
            </>
          )}
          {/* EMI field */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={<Checkbox name="emi" checked={formData.emi} onChange={handleChange} />}
              label="Has EMI?"
            />
          </Grid>
          {formData.emi && (
            <Grid item xs={12} sm={6}>
              <TextField
                label="EMI Amount"
                name="emi_amount"
                value={formData.emi_amount}
                onChange={handleChange}
                type="number"
                fullWidth
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit" fullWidth>
              Add Vehicle
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};
export default AddVehicle;
