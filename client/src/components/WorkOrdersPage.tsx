import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBar, type FilterField, type FilterValue } from './FilterBar';

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

interface NewWorkOrderFormData {
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assetId: string;
  assetName: string;
  assignedTo: string;
  dueDate: string;
  estimatedHours: number;
  notes: string;
}

const initialFormData: NewWorkOrderFormData = {
  title: '',
  description: '',
  status: 'Open',
  priority: 'Medium',
  assetId: '',
  assetName: '',
  assignedTo: '',
  dueDate: '',
  estimatedHours: 0,
  notes: ''
};

const statusColors = {
  'Open': '#2196F3',
  'In Progress': '#FF9800',
  'On Hold': '#9E9E9E',
  'Completed': '#4CAF50',
  'Cancelled': '#F44336'
};

const priorityColors = {
  'Low': '#4CAF50',
  'Medium': '#FF9800',
  'High': '#FF5722',
  'Urgent': '#F44336'
};

export function WorkOrdersPage() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NewWorkOrderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');

  // Load work orders and assets from localStorage
  useEffect(() => {
    const savedWorkOrders = localStorage.getItem('workOrders');
    if (savedWorkOrders) {
      try {
        setWorkOrders(JSON.parse(savedWorkOrders));
      } catch (error) {
        console.error('Error loading work orders:', error);
      }
    }

    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) {
      try {
        setAssets(JSON.parse(savedAssets));
      } catch (error) {
        console.error('Error loading assets:', error);
      }
    }
  }, []);

  // Save work orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('workOrders', JSON.stringify(workOrders));
  }, [workOrders]);

  const handleInputChange = (field: keyof NewWorkOrderFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If an asset is selected, update the asset name
    if (field === 'assetId') {
      const selectedAsset = assets.find(asset => asset.id === value);
      if (selectedAsset) {
        setFormData(prev => ({ ...prev, assetName: selectedAsset.name }));
      }
    }
  };

  const generateWorkOrderNumber = () => {
    const prefix = 'WO';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newWorkOrder: WorkOrder = {
        ...formData,
        id: Date.now().toString(),
        workOrderNumber: generateWorkOrderNumber(),
        createdBy: 'Current User', // This would come from auth context
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actualHours: 0
      };

      setWorkOrders(prev => [...prev, newWorkOrder]);
      setFormData(initialFormData);
      setShowForm(false);
      
      // Navigate to the work order details
      navigate(`/work-orders/${newWorkOrder.id}`);
    } catch (error) {
      console.error('Error creating work order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setShowForm(false);
  };

  const handleRowClick = (workOrderId: string) => {
    navigate(`/work-orders/${workOrderId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    if (diffDays < 0) {
      return `${formatted} (Overdue)`;
    } else if (diffDays === 0) {
      return `${formatted} (Today)`;
    } else if (diffDays === 1) {
      return `${formatted} (Tomorrow)`;
    } else if (diffDays <= 7) {
      return `${formatted} (${diffDays} days)`;
    }
    return formatted;
  };

  // Filter and search work orders
  const getFilteredWorkOrders = () => {
    let filtered = workOrders;
    
    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter(wo => 
        wo.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        wo.description.toLowerCase().includes(searchValue.toLowerCase()) ||
        wo.workOrderNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
        wo.assetName.toLowerCase().includes(searchValue.toLowerCase()) ||
        wo.assignedTo.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // Apply filters
    filters.forEach(filter => {
      filtered = filtered.filter(wo => {
        const fieldValue = wo[filter.field as keyof WorkOrder];
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
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const filteredWorkOrders = getFilteredWorkOrders();

  // Define available filter fields for work orders
  const workOrderFilterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Open', label: 'Open' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'On Hold', label: 'On Hold' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'Urgent', label: 'Urgent' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' }
      ]
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      type: 'text',
      placeholder: 'Enter assignee name'
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      type: 'date'
    }
  ];


  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">📋</div>
      <h2>No Work Orders Yet</h2>
      <p>Create your first work order to start managing maintenance tasks and assignments. Work orders help you track, prioritize, and complete maintenance activities efficiently.</p>
      <button 
        className="mobile-button touch-target"
        onClick={() => setShowForm(true)}
      >
        + Create Your First Work Order
      </button>
    </div>
  );

  const PopulatedState = () => (
    <div className="work-orders-list">
      <FilterBar
        searchPlaceholder="Search work orders by title, description, or work order number..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onFiltersChange={setFilters}
        availableFields={workOrderFilterFields}
      />

      <div className="sort-section">
        <div className="filter-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="filter-select"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="table-container">
        <table className="work-orders-table">
          <thead>
            <tr>
              <th>WO Number</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Asset</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkOrders.map((workOrder) => (
              <tr key={workOrder.id} onClick={() => handleRowClick(workOrder.id)}>
                <td className="wo-number">{workOrder.workOrderNumber}</td>
                <td className="wo-title">
                  <div className="title-cell">
                    <span className="title-text">{workOrder.title}</span>
                    {workOrder.description && (
                      <span className="description-preview">{workOrder.description}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: statusColors[workOrder.status] }}
                  >
                    {workOrder.status}
                  </span>
                </td>
                <td>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: priorityColors[workOrder.priority] }}
                  >
                    {workOrder.priority}
                  </span>
                </td>
                <td className="asset-cell">{workOrder.assetName || 'N/A'}</td>
                <td className="assigned-cell">{workOrder.assignedTo || 'Unassigned'}</td>
                <td className="due-date-cell">
                  <span className={workOrder.dueDate && new Date(workOrder.dueDate) < new Date() ? 'overdue' : ''}>
                    {formatDate(workOrder.dueDate)}
                  </span>
                </td>
                <td className="actions-cell">
                  <button 
                    className="action-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/work-orders/${workOrder.id}/edit`);
                    }}
                    title="Edit work order"
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredWorkOrders.length === 0 && workOrders.length > 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No work orders found</h3>
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
    <div className="work-orders-page">
      <div className="page-header">
        <h1>Work Orders</h1>
        <button 
          className="new-work-order-btn"
          onClick={() => setShowForm(true)}
        >
          + New Work Order
        </button>
      </div>

      {workOrders.length === 0 ? <EmptyState /> : <PopulatedState />}

      {/* Sliding Form Panel */}
      <div className={`form-panel ${showForm ? 'show' : ''}`}>
        <div className="form-panel-overlay" onClick={handleCancel}></div>
        <div className="form-panel-content">
          <div className="form-header">
            <h2>Create New Work Order</h2>
            <button className="close-btn" onClick={handleCancel}>×</button>
          </div>

          <form onSubmit={handleSubmit} className="work-order-form">
            <div className="form-section">
              <h3>Work Order Details</h3>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief description of the work (you can add more details later)"
                    required
                  />
                  <small className="field-help">Only a title is required - you can fill in other details anytime</small>
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
              </div>
            </div>

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
              </div>
            </div>

            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-field">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes or special instructions"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="create-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Work Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}