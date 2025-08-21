import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBar, type FilterField, type FilterValue } from './FilterBar';
import { assetAPI, uploadAPI } from '../services/api';

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
  imageUrls: string[];
  fileUrls: string[];
  createdAt: string;
  organizationId: string;
  createdById: string;
}

interface NewAssetFormData {
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
  selectedImages: File[];
  selectedFiles: File[];
}

const initialFormData: NewAssetFormData = {
  name: '',
  type: '',
  location: '',
  criticality: 'MEDIUM',
  description: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  warrantyExpiry: '',
  category: '',
  status: 'ACTIVE',
  selectedImages: [],
  selectedFiles: []
};

const categories = [
  'Production Equipment',
  'Facility Assets',
  'Vehicles & Fleet',
  'IT Equipment',
  'Safety Equipment',
  'Tools & Instruments',
  'HVAC Systems',
  'Electrical Systems'
];

const criticalityColors = {
  'LOW': '#4CAF50',
  'MEDIUM': '#FF9800',
  'HIGH': '#FF5722',
  'CRITICAL': '#F44336'
};

const assetTypes = [
  'Equipment',
  'Vehicle',
  'Building',
  'Tool',
  'Computer',
  'Furniture',
  'Other'
];

export function AssetsPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NewAssetFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get default values from localStorage or use defaults
  const organizationId = localStorage.getItem('organizationId') || 'default-org';
  const userId = localStorage.getItem('userId') || 'default-user';

  // Load assets from backend on component mount
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const response = await assetAPI.getAll({ organizationId });
        if (response.success) {
          setAssets(response.data);
        }
      } catch (error) {
        console.error('Error loading assets:', error);
        setError('Failed to load assets');
        // Fallback to localStorage
        const savedAssets = localStorage.getItem('assets');
        if (savedAssets) {
          try {
            setAssets(JSON.parse(savedAssets));
          } catch (e) {
            console.error('Error parsing saved assets:', e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssets();
  }, [organizationId]);

  const handleInputChange = (field: keyof NewAssetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, selectedImages: [...prev.selectedImages, ...files] }));
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, selectedFiles: [...prev.selectedFiles, ...files] }));
  };
  
  const removeSelectedImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedImages: prev.selectedImages.filter((_, i) => i !== index)
    }));
  };
  
  const removeSelectedFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrls: string[] = [];
      let fileUrls: string[] = [];
      
      // Upload images and files if selected
      if (formData.selectedImages.length > 0 || formData.selectedFiles.length > 0) {
        const allFiles = [...formData.selectedImages, ...formData.selectedFiles];
        const uploadResponse = await uploadAPI.uploadFiles(
          allFiles,
          organizationId,
          userId
        );
        
        if (uploadResponse.success) {
          const uploadedFiles = uploadResponse.data.files;
          imageUrls = uploadedFiles
            .filter((f: any) => f.isImage)
            .map((f: any) => f.url);
          fileUrls = uploadedFiles
            .filter((f: any) => !f.isImage)
            .map((f: any) => f.url);
        }
      }
      
      // Create asset with file URLs
      const assetData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        location: formData.location,
        status: formData.status,
        criticality: formData.criticality,
        category: formData.category,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber,
        purchaseDate: formData.purchaseDate || null,
        warrantyExpiry: formData.warrantyExpiry || null,
        imageUrls,
        fileUrls,
        organizationId,
        createdById: userId
      };
      
      const response = await assetAPI.create(assetData);
      
      if (response.success) {
        // Update local state
        setAssets(prev => [...prev, response.data]);
        // Also save to localStorage as backup
        localStorage.setItem('assets', JSON.stringify([...assets, response.data]));
        setFormData(initialFormData);
        setShowForm(false);
        // Navigate to the new asset's details page
        navigate(`/assets/${response.data.id}`);
      } else {
        throw new Error(response.message || 'Failed to create asset');
      }
    } catch (error: any) {
      console.error('Error creating asset:', error);
      setError(error.message || 'Failed to create asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setShowForm(false);
  };

  // Filter assets based on search and filters
  const getFilteredAssets = () => {
    let filtered = assets;
    
    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchValue.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchValue.toLowerCase()) ||
        asset.manufacturer.toLowerCase().includes(searchValue.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // Apply filters
    filters.forEach(filter => {
      filtered = filtered.filter(asset => {
        const fieldValue = asset[filter.field as keyof Asset];
        if (!fieldValue) return false;
        
        switch (filter.operator) {
          case 'equals':
            return fieldValue.toString().toLowerCase() === filter.value.toString().toLowerCase();
          case 'contains':
            return fieldValue.toString().toLowerCase().includes(filter.value.toString().toLowerCase());
          default:
            return true;
        }
      });
    });
    
    return filtered;
  };

  const filteredAssets = getFilteredAssets();

  // Define available filter fields for assets
  const assetFilterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' }
      ]
    },
    {
      key: 'criticality',
      label: 'Criticality',
      type: 'select',
      options: [
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'CRITICAL', label: 'Critical' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: categories.map(cat => ({ value: cat, label: cat }))
    },
    {
      key: 'location',
      label: 'Location',
      type: 'text',
      placeholder: 'Enter location'
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      placeholder: 'Enter manufacturer'
    }
  ];

  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">🏭</div>
      <h2>Start adding Assets</h2>
      <p>Assets are the equipment, facilities, and resources that your organization maintains. Add your first asset to get started with tracking and maintenance.</p>
      <button 
        className="mobile-button touch-target"
        onClick={() => setShowForm(true)}
      >
        + Add Your First Asset
      </button>
    </div>
  );

  const AssetsList = () => (
    <div className="assets-list">
      <div className="assets-header">
        <h2>Assets ({filteredAssets.length} of {assets.length})</h2>
      </div>

      <FilterBar
        searchPlaceholder="Search assets by name, location, or description..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onFiltersChange={setFilters}
        availableFields={assetFilterFields}
      />

      <div className="assets-grid">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="asset-card">
            <div className="asset-header">
              <h3>{asset.name}</h3>
              <div 
                className="criticality-badge"
                style={{ backgroundColor: criticalityColors[asset.criticality] }}
              >
                {asset.criticality}
              </div>
            </div>
            <div className="asset-details">
              <div className="asset-detail">
                <span className="label">Location:</span>
                <span className="value">{asset.location}</span>
              </div>
              <div className="asset-detail">
                <span className="label">Category:</span>
                <span className="value">{asset.category}</span>
              </div>
              <div className="asset-detail">
                <span className="label">Status:</span>
                <span className={`status-badge ${asset.status.toLowerCase().replace('_', '-')}`}>
                  {asset.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="asset-detail">
                <span className="label">Manufacturer:</span>
                <span className="value">{asset.manufacturer}</span>
              </div>
              <div className="asset-detail">
                <span className="label">Model:</span>
                <span className="value">{asset.model}</span>
              </div>
            </div>
            <div className="asset-actions">
              <button className="action-btn" onClick={() => navigate(`/assets/${asset.id}`)}>View</button>
              <button className="action-btn">Edit</button>
            </div>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && assets.length > 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No assets found</h3>
          <p>Try adjusting your search terms or filters to find what you're looking for.</p>
          <button 
            className="mobile-button"
            onClick={() => {
              setSearchValue('');
              setFilters([]);
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="assets-page">
      <div className="page-header">
        <h1>Assets</h1>
        <button 
          className="new-asset-btn"
          onClick={() => setShowForm(true)}
        >
          + New Asset
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <EmptyState />
      ) : (
        <AssetsList />
      )}

      {/* Sliding Form Panel */}
      <div className={`form-panel ${showForm ? 'show' : ''}`}>
        <div className="form-panel-overlay" onClick={handleCancel}></div>
        <div className="form-panel-content">
          <div className="form-header">
            <h2>Create New Asset</h2>
            <button className="close-btn" onClick={handleCancel}>×</button>
          </div>

          <form onSubmit={handleSubmit} className="asset-form">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="name">Asset Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter asset name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="type">Asset Type *</label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    required
                  >
                    <option value="">Select type</option>
                    {assetTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Building, Floor, Room"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="criticality">Criticality *</label>
                  <select
                    id="criticality"
                    value={formData.criticality}
                    onChange={(e) => handleInputChange('criticality', e.target.value as any)}
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the asset and its purpose"
                  rows={3}
                />
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
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="Equipment manufacturer"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="model">Model</label>
                  <input
                    type="text"
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="Model number/name"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="serialNumber">Serial Number</label>
                  <input
                    type="text"
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="Serial number"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as any)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="purchaseDate">Purchase Date</label>
                  <input
                    type="date"
                    id="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="warrantyExpiry">Warranty Expiry</label>
                  <input
                    type="date"
                    id="warrantyExpiry"
                    value={formData.warrantyExpiry}
                    onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Media & Documents</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="pictures">Pictures</label>
                  <div className="file-upload-area">
                    <input
                      ref={imageInputRef}
                      type="file"
                      id="pictures"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="pictures" className="file-upload-btn">
                      📷 Add Photos
                    </label>
                    <p>Upload photos of the asset</p>
                    {formData.selectedImages.length > 0 && (
                      <div className="selected-files">
                        {formData.selectedImages.map((file, index) => (
                          <div key={index} className="selected-file">
                            <span>{file.name}</span>
                            <button type="button" onClick={() => removeSelectedImage(index)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="files">Files</label>
                  <div className="file-upload-area">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="files"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="files" className="file-upload-btn">
                      📎 Add Files
                    </label>
                    <p>Manuals, specifications, etc.</p>
                    {formData.selectedFiles.length > 0 && (
                      <div className="selected-files">
                        {formData.selectedFiles.map((file, index) => (
                          <div key={index} className="selected-file">
                            <span>{file.name}</span>
                            <button type="button" onClick={() => removeSelectedFile(index)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="create-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Asset'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}