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

interface Comment {
  id: string;
  workOrderId: string;
  author: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'status_change' | 'assignment' | 'system';
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    oldAssignee?: string;
    newAssignee?: string;
  };
}

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

const statusSteps = ['Open', 'In Progress', 'Completed'];

export function WorkOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<WorkOrder['status']>('Open');

  useEffect(() => {
    // Load work order from localStorage
    const savedWorkOrders = localStorage.getItem('workOrders');
    if (savedWorkOrders) {
      try {
        const workOrders = JSON.parse(savedWorkOrders);
        const foundWorkOrder = workOrders.find((wo: WorkOrder) => wo.id === id);
        if (foundWorkOrder) {
          setWorkOrder(foundWorkOrder);
          setSelectedStatus(foundWorkOrder.status);
          
          // Load comments from localStorage
          const savedComments = localStorage.getItem(`workOrderComments_${id}`);
          if (savedComments) {
            setComments(JSON.parse(savedComments));
          } else {
            // Add initial system comment
            const initialComment: Comment = {
              id: '1',
              workOrderId: id!,
              author: 'System',
              content: 'Work order created',
              timestamp: foundWorkOrder.createdAt,
              type: 'system'
            };
            setComments([initialComment]);
          }
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
  }, [id, navigate]);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem(`workOrderComments_${id}`, JSON.stringify(comments));
    }
  }, [comments, id]);

  const handleBack = () => {
    navigate('/work-orders');
  };

  const handleStatusChange = () => {
    if (!workOrder) return;
    
    const oldStatus = workOrder.status;
    
    // Update work order status
    const updatedWorkOrder = { ...workOrder, status: selectedStatus, updatedAt: new Date().toISOString() };
    setWorkOrder(updatedWorkOrder);
    
    // Update in localStorage
    const savedWorkOrders = localStorage.getItem('workOrders');
    if (savedWorkOrders) {
      const workOrders = JSON.parse(savedWorkOrders);
      const index = workOrders.findIndex((wo: WorkOrder) => wo.id === id);
      if (index !== -1) {
        workOrders[index] = updatedWorkOrder;
        localStorage.setItem('workOrders', JSON.stringify(workOrders));
      }
    }
    
    // Add status change comment
    const statusComment: Comment = {
      id: Date.now().toString(),
      workOrderId: id!,
      author: 'Current User',
      content: `Status changed from ${oldStatus} to ${selectedStatus}`,
      timestamp: new Date().toISOString(),
      type: 'status_change',
      metadata: {
        oldStatus,
        newStatus: selectedStatus
      }
    };
    
    setComments(prev => [...prev, statusComment]);
    setShowStatusModal(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmittingComment(true);
    
    const comment: Comment = {
      id: Date.now().toString(),
      workOrderId: id!,
      author: 'Current User',
      content: newComment,
      timestamp: new Date().toISOString(),
      type: 'comment'
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment('');
    setIsSubmittingComment(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDueDate = (dateString: string) => {
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
      return <span className="overdue">{formatted} (Overdue by {Math.abs(diffDays)} days)</span>;
    } else if (diffDays === 0) {
      return <span className="due-today">{formatted} (Due Today)</span>;
    } else if (diffDays === 1) {
      return <span className="due-soon">{formatted} (Due Tomorrow)</span>;
    } else if (diffDays <= 7) {
      return <span className="due-soon">{formatted} (Due in {diffDays} days)</span>;
    }
    return formatted;
  };

  const getStatusStepIndex = (status: string) => {
    const index = statusSteps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  if (!workOrder) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading work order details...</p>
      </div>
    );
  }

  return (
    <div className="work-order-details-page">
      {/* Header */}
      <div className="wo-details-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Work Orders
        </button>
        <div className="header-content">
          <div className="header-info">
            <span className="wo-number-large">{workOrder.workOrderNumber}</span>
            <h1>{workOrder.title}</h1>
          </div>
          <div className="header-actions">
            <button className="edit-button" onClick={() => navigate(`/work-orders/${id}/edit`)}>✏️ Edit</button>
            <button className="print-button">🖨️ Print</button>
          </div>
        </div>
      </div>

      {/* Status Tracker */}
      <div className="status-tracker-section">
        <h3>Status Progress</h3>
        <div className="status-tracker">
          {statusSteps.map((step, index) => {
            const currentStepIndex = getStatusStepIndex(workOrder.status);
            const isCompleted = index <= currentStepIndex;
            const isActive = step === workOrder.status;
            
            return (
              <div key={step} className="status-step">
                <div className={`step-indicator ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className="step-label">{step}</span>
                {index < statusSteps.length - 1 && (
                  <div className={`step-line ${isCompleted ? 'completed' : ''}`}></div>
                )}
              </div>
            );
          })}
        </div>
        <button 
          className="change-status-btn"
          onClick={() => setShowStatusModal(true)}
        >
          Change Status
        </button>
      </div>

      <div className="wo-details-content">
        {/* Main Information */}
        <div className="details-main">
          <div className="details-card">
            <h3>Work Order Information</h3>
            
            <div className="detail-row">
              <span className="detail-label">Description</span>
              <p className="detail-value">{workOrder.description || 'No description provided'}</p>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span 
                  className="status-badge-large"
                  style={{ backgroundColor: statusColors[workOrder.status] }}
                >
                  {workOrder.status}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Priority</span>
                <span 
                  className="priority-badge-large"
                  style={{ backgroundColor: priorityColors[workOrder.priority] }}
                >
                  {workOrder.priority}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Asset</span>
                <span className="detail-value asset-link">
                  {workOrder.assetName ? (
                    <a onClick={() => navigate(`/assets/${workOrder.assetId}`)}>
                      🔗 {workOrder.assetName}
                    </a>
                  ) : 'No asset linked'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Assigned To</span>
                <span className="detail-value">{workOrder.assignedTo || 'Unassigned'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Due Date</span>
                <span className="detail-value">{formatDueDate(workOrder.dueDate)}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Created By</span>
                <span className="detail-value">{workOrder.createdBy}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Created On</span>
                <span className="detail-value">{formatDate(workOrder.createdAt)}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">{formatDate(workOrder.updatedAt)}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Estimated Hours</span>
                <span className="detail-value">{workOrder.estimatedHours || 0} hrs</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Actual Hours</span>
                <span className="detail-value">{workOrder.actualHours || 0} hrs</span>
              </div>
            </div>

            {workOrder.notes && (
              <div className="detail-row">
                <span className="detail-label">Notes</span>
                <p className="detail-value">{workOrder.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments/Activity Section */}
        <div className="activity-section">
          <div className="activity-card">
            <h3>Activity & Comments</h3>
            
            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or update..."
                rows={3}
                required
              />
              <button 
                type="submit" 
                className="submit-comment-btn"
                disabled={isSubmittingComment || !newComment.trim()}
              >
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>

            {/* Comments List */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">No activity yet. Add a comment to start the conversation.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className={`comment-item ${comment.type}`}>
                    <div className="comment-avatar">
                      {comment.type === 'system' ? '🤖' : 
                       comment.type === 'status_change' ? '🔄' :
                       comment.type === 'assignment' ? '👤' : '💬'}
                    </div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author}</span>
                        <span className="comment-time">{formatDate(comment.timestamp)}</span>
                      </div>
                      <p className="comment-text">
                        {comment.content}
                        {comment.type === 'status_change' && comment.metadata && (
                          <span className="status-change-info">
                            <span 
                              className="old-status"
                              style={{ backgroundColor: statusColors[comment.metadata.oldStatus as keyof typeof statusColors] }}
                            >
                              {comment.metadata.oldStatus}
                            </span>
                            →
                            <span 
                              className="new-status"
                              style={{ backgroundColor: statusColors[comment.metadata.newStatus as keyof typeof statusColors] }}
                            >
                              {comment.metadata.newStatus}
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Change Work Order Status</h2>
            <div className="status-options">
              {['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map((status) => (
                <label key={status} className="status-option">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value as WorkOrder['status'])}
                  />
                  <span 
                    className="status-option-label"
                    style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
                  >
                    {status}
                  </span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleStatusChange}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}