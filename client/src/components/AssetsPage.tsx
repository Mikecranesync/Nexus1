import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBar, type FilterField, type FilterValue } from './FilterBar';

interface Asset {
  id: string;
  name: string;
  location: string;
  criticality: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  pictures: string[];
  files: string[];
  createdAt: string;
}

interface NewAssetFormData {
  name: string;
  location: string;
  criticality: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyExpiry: string;
  category: string;
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  pictures: string[];
  files: string[];
}

const initialFormData: NewAssetFormData = {
  name: '',
  location: '',
  criticality: 'Medium',
  description: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  warrantyExpiry: '',
  category: '',
  status: 'Active',
  pictures: [],
  files: []
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
  'Low': '#4CAF50',
  'Medium': '#FF9800',
  'High': '#FF5722',
  'Critical': '#F44336'
};

export function AssetsPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NewAssetFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterValue[]>([]);

  // Load assets from localStorage on component mount
  useEffect(() => {
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) {
      try {
        setAssets(JSON.parse(savedAssets));
      } catch (error) {
        console.error('Error loading assets:', error);
      }
    }
  }, []);

  // Save assets to localStorage whenever assets change
  useEffect(() => {
    localStorage.setItem('assets', JSON.stringify(assets));
  }, [assets]);

  const handleInputChange = (field: keyof NewAssetFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newAsset: Asset = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      setAssets(prev => [...prev, newAsset]);
      setFormData(initialFormData);
      setShowForm(false);
      // Navigate to the new asset's details page
      navigate(`/assets/${newAsset.id}`);
    } catch (error) {
      console.error('Error creating asset:', error);
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
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
        { value: 'Under Maintenance', label: 'Under Maintenance' }
      ]
    },
    {
      key: 'criticality',
      label: 'Criticality',
      type: 'select',
      options: [
        { value: 'Low', label: 'Low' },
        { value: 'Medium', label: 'Medium' },
        { value: 'High', label: 'High' },
        { value: 'Critical', label: 'Critical' }
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
                <span className={`status-badge ${asset.status.toLowerCase().replace(' ', '-')}`}>
                  {asset.status}
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

      {assets.length === 0 ? <EmptyState /> : <AssetsList />}

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
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
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
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Maintenance">Under Maintenance</option>
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
                      type="file"
                      id="pictures"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="pictures" className="file-upload-btn">
                      📷 Add Photos
                    </label>
                    <p>Upload photos of the asset</p>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="files">Files</label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="files"
                      multiple
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="files" className="file-upload-btn">
                      📎 Add Files
                    </label>
                    <p>Manuals, specifications, etc.</p>
                  </div>
                </div>
              </div>
            </div>

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