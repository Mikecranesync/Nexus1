import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetAPI } from '../services/api';

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  category: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';
  imageUrls: string | string[];
  fileUrls: string | string[];
  createdAt: string;
  organizationId: string;
  createdById: string;
}

export function AssetEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAsset = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await assetAPI.getById(id);
        
        if (response.success) {
          setAsset(response.data);
          setFormData({
            name: response.data.name,
            type: response.data.type,
            location: response.data.location,
            criticality: response.data.criticality,
            description: response.data.description,
            manufacturer: response.data.manufacturer,
            model: response.data.model,
            serialNumber: response.data.serialNumber,
            purchaseDate: response.data.purchaseDate,
            warrantyExpiry: response.data.warrantyExpiry,
            category: response.data.category,
            status: response.data.status
          });
        } else {
          throw new Error('Asset not found');
        }
      } catch (error) {
        console.error('Error loading asset:', error);
        setError('Failed to load asset');
        
        // Fallback to localStorage
        const savedAssets = localStorage.getItem('assets');
        if (savedAssets) {
          try {
            const assets = JSON.parse(savedAssets);
            const foundAsset = assets.find((a: Asset) => a.id === id);
            if (foundAsset) {
              setAsset(foundAsset);
              setFormData({
                name: foundAsset.name,
                type: foundAsset.type,
                location: foundAsset.location,
                criticality: foundAsset.criticality,
                description: foundAsset.description,
                manufacturer: foundAsset.manufacturer,
                model: foundAsset.model,
                serialNumber: foundAsset.serialNumber,
                purchaseDate: foundAsset.purchaseDate,
                warrantyExpiry: foundAsset.warrantyExpiry,
                category: foundAsset.category,
                status: foundAsset.status
              });
              setError(null);
            } else {
              navigate('/assets');
            }
          } catch (e) {
            navigate('/assets');
          }
        } else {
          navigate('/assets');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAsset();
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!id || !asset) return;
    
    try {
      setIsSaving(true);
      setError(null);

      // Prepare update data with required fields
      const updateData = {
        ...formData,
        updatedById: asset.createdById, // Use the original creator ID as updater
        // Ensure dates are properly formatted
        purchaseDate: formData.purchaseDate || null,
        warrantyExpiry: formData.warrantyExpiry || null
      };

      console.log('Saving asset with data:', updateData);

      try {
        // Try API first
        const response = await assetAPI.update(id, updateData);
        
        if (response.success) {
          console.log('Asset updated successfully via API');
          
          // Update localStorage as backup
          const savedAssets = localStorage.getItem('assets');
          if (savedAssets) {
            const assets = JSON.parse(savedAssets);
            const updatedAssets = assets.map((a: Asset) => 
              a.id === id ? { ...a, ...formData } : a
            );
            localStorage.setItem('assets', JSON.stringify(updatedAssets));
          }
          
          // Navigate back to asset details
          navigate(`/assets/${id}`);
          return;
        } else {
          throw new Error(response.message || 'API update failed');
        }
      } catch (apiError) {
        console.error('API update failed, trying localStorage:', apiError);
        
        // Fallback to localStorage update
        const savedAssets = localStorage.getItem('assets');
        if (savedAssets) {
          try {
            const assets = JSON.parse(savedAssets);
            const updatedAssets = assets.map((a: Asset) => 
              a.id === id ? { ...a, ...formData } : a
            );
            localStorage.setItem('assets', JSON.stringify(updatedAssets));
            console.log('Asset updated successfully via localStorage');
            
            // Navigate back to asset details
            navigate(`/assets/${id}`);
            return;
          } catch (localError) {
            console.error('localStorage update also failed:', localError);
            throw new Error('Failed to update asset in both API and localStorage');
          }
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      setError(`Failed to save changes: ${error.message || error}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/assets/${id}`);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading asset for editing...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="error-container">
        <h2>Asset Not Found</h2>
        <p>The asset you're trying to edit could not be found.</p>
        <button className="back-button" onClick={() => navigate('/assets')}>
          ← Back to Assets
        </button>
      </div>
    );
  }

  return (
    <div className="asset-edit-page">
      <div className="asset-edit-header">
        <button className="back-button" onClick={handleCancel}>
          ← Back to Asset Details
        </button>
        <h1>Edit Asset: {asset.name}</h1>
      </div>
      
      {error && (
        <div className="error-message" style={{ 
          backgroundColor: '#fee', 
          color: '#c33', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          border: '1px solid #fcc'
        }}>
          {error}
        </div>
      )}
      
      <div className="asset-edit-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Asset Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="type">Type</label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Status & Priority</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status || 'ACTIVE'}
                onChange={handleInputChange}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              </select>
            </div>
            
            <div className="form-field">
              <label htmlFor="criticality">Criticality</label>
              <select
                id="criticality"
                name="criticality"
                value={formData.criticality || 'MEDIUM'}
                onChange={handleInputChange}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Technical Details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="manufacturer">Manufacturer</label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="model">Model</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model || ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="serialNumber">Serial Number</label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                value={formData.serialNumber || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Dates</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="purchaseDate">Purchase Date</label>
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                value={formData.purchaseDate ? formData.purchaseDate.split('T')[0] : ''}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="warrantyExpiry">Warranty Expiry</label>
              <input
                type="date"
                id="warrantyExpiry"
                name="warrantyExpiry"
                value={formData.warrantyExpiry ? formData.warrantyExpiry.split('T')[0] : ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Description</h3>
          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Enter asset description..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="save-button" 
            onClick={handleSave}
            disabled={isSaving || !formData.name}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}