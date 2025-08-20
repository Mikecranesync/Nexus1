import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assetId: string;
  assetName: string;
  assignedTo: string;
  createdBy: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  estimatedHours: number;
  actualHours: number;
  notes: string;
}

interface EditFormData {
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assetId: string;
  assetName: string;
  assignedTo: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  notes: string;
}

export function WorkOrderEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    title: '',
    description: '',
    status: 'Open',
    priority: 'Medium',
    assetId: '',
    assetName: '',
    assignedTo: '',
    dueDate: '',
    estimatedHours: 0,
    actualHours: 0,
    notes: ''
  });
  const [assets, setAssets] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load work order data
    const savedWorkOrders = localStorage.getItem('workOrders');
    if (savedWorkOrders) {
      try {
        const workOrders = JSON.parse(savedWorkOrders);
        const foundWorkOrder = workOrders.find((wo: WorkOrder) => wo.id === id);
        if (foundWorkOrder) {
          setWorkOrder(foundWorkOrder);
          setFormData({
            title: foundWorkOrder.title || '',
            description: foundWorkOrder.description || '',
            status: foundWorkOrder.status || 'Open',
            priority: foundWorkOrder.priority || 'Medium',
            assetId: foundWorkOrder.assetId || '',
            assetName: foundWorkOrder.assetName || '',
            assignedTo: foundWorkOrder.assignedTo || '',
            dueDate: foundWorkOrder.dueDate || '',
            estimatedHours: foundWorkOrder.estimatedHours || 0,
            actualHours: foundWorkOrder.actualHours || 0,
            notes: foundWorkOrder.notes || ''
          });
        } else {
          navigate('/work-orders');
        }
      } catch (error) {
        console.error('Error loading work order:', error);
        navigate('/work-orders');
      }
    } else {
      navigate('/work-orders');
    }

    // Load assets
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) {
      try {
        setAssets(JSON.parse(savedAssets));
      } catch (error) {
        console.error('Error loading assets:', error);
      }
    }
  }, [id, navigate]);

  const handleInputChange = (field: keyof EditFormData, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // If an asset is selected, update the asset name
      if (field === 'assetId') {
        const selectedAsset = assets.find(asset => asset.id === value);
        if (selectedAsset) {
          newData.assetName = selectedAsset.name;
        } else {
          newData.assetName = '';
        }
      }
      
      return newData;
    });
    setHasChanges(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!workOrder) return;

      const updatedWorkOrder: WorkOrder = {
        ...workOrder,
        ...formData,
        updatedAt: new Date().toISOString()
      };

      // Update in localStorage
      const savedWorkOrders = localStorage.getItem('workOrders');
      if (savedWorkOrders) {
        const workOrders = JSON.parse(savedWorkOrders);
        const index = workOrders.findIndex((wo: WorkOrder) => wo.id === id);
        if (index !== -1) {
          workOrders[index] = updatedWorkOrder;
          localStorage.setItem('workOrders', JSON.stringify(workOrders));
          
          setWorkOrder(updatedWorkOrder);
          setHasChanges(false);
          
          // Navigate back to details page
          navigate(`/work-orders/${id}`);
        }
      }
    } catch (error) {
      console.error('Error updating work order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmDiscard) return;
    }
    navigate(`/work-orders/${id}`);
  };

  const handleBack = () => {
    if (hasChanges) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmDiscard) return;
    }
    navigate('/work-orders');
  };

  if (!workOrder) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading work order...</p>
      </div>
    );
  }

  return (
    <div className="work-order-edit-page">
      {/* Header */}
      <div className="edit-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Work Orders
        </button>
        <div className="header-content">
          <div className="header-info">
            <span className="wo-number-large">{workOrder.workOrderNumber}</span>
            <h1>Edit Work Order</h1>
          </div>
          <div className="header-actions">
            {hasChanges && (
              <span className="unsaved-indicator">● Unsaved changes</span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="edit-form-container">
        <form onSubmit={handleSave} className="work-order-edit-form">
          <div className="form-sections">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter work order title"
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed description of the work to be performed"
                    rows={4}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Assignment & Schedule */}
            <div className="form-section">
              <h3>Assignment & Schedule</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="assetId">Asset</label>
                  <select
                    id="assetId"
                    value={formData.assetId}
                    onChange={(e) => handleInputChange('assetId', e.target.value)}
                  >
                    <option value="">Select an asset</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - {asset.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="assignedTo">Assigned To</label>
                  <input
                    type="text"
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    placeholder="Technician or team"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="estimatedHours">Estimated Hours</label>
                  <input
                    type="number"
                    id="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={(e) => handleInputChange('estimatedHours', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="actualHours">Actual Hours</label>
                  <input
                    type="number"
                    id="actualHours"
                    value={formData.actualHours}
                    onChange={(e) => handleInputChange('actualHours', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-field">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes or special instructions"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-btn" 
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Floating Save Button for Mobile */}
      <div className="floating-save-container">
        <button 
          type="button"
          onClick={handleSave}
          className="floating-save-btn"
          disabled={isSubmitting || !formData.title.trim() || !hasChanges}
        >
          {isSubmitting ? '💾 Saving...' : hasChanges ? '💾 Save Changes' : '✅ Saved'}
        </button>
      </div>
    </div>
  );
}