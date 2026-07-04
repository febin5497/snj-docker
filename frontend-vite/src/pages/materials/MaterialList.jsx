import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, TableHead, TableBody, TableRow, TableCell, Container, Typography, FormHelperText } from '@mui/material';
import { FiEdit, FiTrash } from 'react-icons/fi';
import api from '../../api/api';
import '../../styles/MaterialList.css';
const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  // Fetch all materials from the backend when the component mounts
  useEffect(() => {
    api.get('/api/materials')
      .then((response) => {
        // Handle paginated response from BaseResourceRouter
        const materialsData = response.data?.data || response.data || [];
        setMaterials(Array.isArray(materialsData) ? materialsData : []);
      })
      .catch((error) => {
        setError('Failed to load materials. Please try again later.');
      });
  }, []);
  const handleAddMaterialClick = () => {
    navigate('/materials/add');
  };
  const handleEditClick = (materialId) => {
    navigate(`/materials/edit/${materialId}`);
  };
  const handleDeleteClick = (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      api.delete(`/api/materials/${materialId}`)
        .then(() => {
          setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== materialId));
          setSuccess('Material deleted successfully');
        })
        .catch((error) => {
          setError('An error occurred while deleting the material.');
        });
    }
  };
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Materials List
      </Typography>
      {/* Error message */}
      {error && <FormHelperText error>{error}</FormHelperText>}
      {/* Success message */}
      {success && <FormHelperText sx={{ color: 'green' }}>{success}</FormHelperText>}
      {/* Add Material Button */}
      <Button variant="contained" color="primary" onClick={handleAddMaterialClick} sx={{ marginBottom: 2 }}>
        Add Material
      </Button>
      {/* Material Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Date of Entry</TableCell> {/* New column for Date of Entry */}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {materials.length > 0 ? (
            materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>{material.name}</TableCell>
                <TableCell>{material.description}</TableCell>
                <TableCell>{material.quantity}</TableCell>
                <TableCell>{material.price}</TableCell>
                <TableCell>{material.unit_of_measurement}</TableCell>
                {/* Display Project Name and link to project details */}
                <TableCell>
                  {material.project_id ? (
                    <Button
                      variant="text"
                      onClick={() => navigate(`/projects/${material.project_id}`)} // Navigate to project details page
                    >
                      {material.project_name || 'Unnamed Project'}
                    </Button>
                  ) : 'No Project'}
                </TableCell>
                {/* Display the Date of Entry */}
                <TableCell>{new Date(material.created_at).toLocaleDateString()}</TableCell> {/* Format the date */}
                {/* Actions: Edit and Delete */}
                <TableCell>
                  <Button onClick={() => handleEditClick(material.id)} color="primary">
                    <FiEdit size={20} />
                  </Button>
                  <Button onClick={() => handleDeleteClick(material.id)} color="secondary">
                    <FiTrash size={20} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} align="center">
                No materials found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Container>
  );
};
export default MaterialList;
