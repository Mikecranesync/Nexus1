import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  imageUrls: string | string[];
  fileUrls: string | string[];
  createdAt: string;
  organizationId: string;
  createdById: string;
}

interface HistoryItem {
  id: string;
  date: string;
  type: 'Created' | 'Updated' | 'Maintenance' | 'Status Change';
  description: string;
  user: string;
}

const criticalityColors = {
  'LOW': '#4CAF50',
  'MEDIUM': '#FF9800',
  'HIGH': '#FF5722',
  'CRITICAL': '#F44336'
};

export function AssetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAsset = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await assetAPI.getById(id);
        
        if (response.success) {
          setAsset(response.data);
          
          // Generate sample history
          setHistory([
            {
              id: '1',
              date: response.data.createdAt,
              type: 'Created',
              description: 'Asset was created and added to inventory',
              user: 'System'
            }
          ]);
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
              setHistory([{
                id: '1',
                date: foundAsset.createdAt,
                type: 'Created',
                description: 'Asset was created and added to inventory',
                user: 'System'
              }]);
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

  const handleEdit = () => {
    // Navigate to edit page (to be implemented)
    console.log('Edit asset:', id);
  };

  const handleWorkOrder = () => {
    // Navigate to create work order page (to be implemented)
    console.log('Create work order for asset:', id);
  };

  const handleBack = () => {
    navigate('/assets');
  };

  if (!asset) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading asset details...</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="asset-details-page">
      {/* Header */}
      <div className="asset-details-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Assets
        </button>
        <div className="header-content">
          <div className="header-title">
            <h1>{asset.name}</h1>
            <span 
              className="criticality-badge-large"
              style={{ backgroundColor: criticalityColors[asset.criticality] }}
            >
              {asset.criticality} Priority
            </span>
          </div>
          <button className="edit-button" onClick={handleEdit}>
            ✏️ Edit
          </button>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'details' ? (
          <div className="details-content">
            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="primary-action-button" onClick={handleWorkOrder}>
                🔧 Use in New Work Order
              </button>
            </div>

            {/* Key Information Cards */}
            <div className="info-cards-grid">
              <div className="info-card">
                <div className="info-card-header">
                  <span className="info-icon">📍</span>
                  <h3>Location</h3>
                </div>
                <p className="info-value">{asset.location}</p>
              </div>

              <div className="info-card">
                <div className="info-card-header">
                  <span className="info-icon">🔄</span>
                  <h3>Status</h3>
                </div>
                <p className={`status-display ${asset.status.toLowerCase().replace('_', '-')}`}>
                  {asset.status.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="info-card">
                <div className="info-card-header">
                  <span className="info-icon">⚠️</span>
                  <h3>Criticality</h3>
                </div>
                <p className="info-value">{asset.criticality}</p>
              </div>

              <div className="info-card">
                <div className="info-card-header">
                  <span className="info-icon">📦</span>
                  <h3>Category</h3>
                </div>
                <p className="info-value">{asset.category}</p>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="detail-sections">
              <div className="detail-section">
                <h3>General Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{asset.description || 'No description provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Manufacturer</span>
                    <span className="detail-value">{asset.manufacturer || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Model</span>
                    <span className="detail-value">{asset.model || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Serial Number</span>
                    <span className="detail-value">{asset.serialNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Lifecycle Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Purchase Date</span>
                    <span className="detail-value">{formatDate(asset.purchaseDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Warranty Expiry</span>
                    <span className="detail-value">{formatDate(asset.warrantyExpiry)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created On</span>
                    <span className="detail-value">{formatDate(asset.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Asset ID</span>
                    <span className="detail-value">#{asset.id}</span>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="detail-section">
                <h3>Documents & Media</h3>
                
                {/* Images Section */}
                {(() => {
                  const imageUrls = typeof asset.imageUrls === 'string' 
                    ? JSON.parse(asset.imageUrls || '[]')
                    : asset.imageUrls || [];
                  return imageUrls.length > 0 ? (
                  <div className="media-section">
                    <h4>Images</h4>
                    <div className="images-grid">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="image-thumbnail" onClick={() => setSelectedImage(url)}>
                          <img src={url} alt={`Asset ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="document-placeholder">
                    <span className="document-icon">📷</span>
                    <p>No photos uploaded</p>
                  </div>
                )})()}
                
                {/* Files Section */}
                {(() => {
                  const fileUrls = typeof asset.fileUrls === 'string' 
                    ? JSON.parse(asset.fileUrls || '[]')
                    : asset.fileUrls || [];
                  return fileUrls.length > 0 ? (
                  <div className="media-section">
                    <h4>Documents</h4>
                    <div className="files-list">
                      {fileUrls.map((url, index) => {
                        const fileName = url.split('/').pop() || `Document ${index + 1}`;
                        return (
                          <div key={index} className="file-item">
                            <span className="file-icon">📄</span>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="file-link">
                              {fileName}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="document-placeholder">
                    <span className="document-icon">📄</span>
                    <p>No documents uploaded</p>
                  </div>
                )})()}
              </div>
            </div>
          </div>
        ) : (
          <div className="history-content">
            <div className="history-timeline">
              {history.map((item, index) => (
                <div key={item.id} className="history-item">
                  <div className="timeline-marker">
                    <div className="timeline-dot"></div>
                    {index < history.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  <div className="history-card">
                    <div className="history-header">
                      <span className={`history-type ${item.type.toLowerCase().replace(' ', '-')}`}>
                        {item.type}
                      </span>
                      <span className="history-date">{formatDate(item.date)}</span>
                    </div>
                    <p className="history-description">{item.description}</p>
                    <p className="history-user">By: {item.user}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {history.length === 1 && (
              <div className="empty-history">
                <p>No additional history available for this asset.</p>
                <p className="hint">History will be recorded as changes are made to this asset.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content">
            <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage} alt="Asset" />
          </div>
        </div>
      )}
    </div>
  );
}