import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

interface Asset {
  id: string;
  name: string;
  location: string;
  type: string;
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  criticality: 'Low' | 'Medium' | 'High' | 'Critical';
  lastMaintenance: string;
  nextMaintenance: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  warranty: string;
  notes: string;
}

interface ChartData {
  date: string;
  completed: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    // Load work orders
    const savedWorkOrders = localStorage.getItem('workOrders');
    if (savedWorkOrders) {
      try {
        setWorkOrders(JSON.parse(savedWorkOrders));
      } catch (error) {
        console.error('Error loading work orders:', error);
      }
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

    // Generate chart data for the last 7 days
    generateChartData();
  }, []);

  const generateChartData = () => {
    const data: ChartData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // For demo purposes, generate some sample completion data
      const completed = Math.floor(Math.random() * 8) + 1;
      
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        completed
      });
    }
    
    setChartData(data);
  };

  // Calculate metrics
  const openWorkOrders = workOrders.filter(wo => wo.status === 'Open' || wo.status === 'In Progress').length;
  
  const overdueTasks = workOrders.filter(wo => {
    if (!wo.dueDate || wo.status === 'Completed' || wo.status === 'Cancelled') return false;
    const dueDate = new Date(wo.dueDate);
    const today = new Date();
    return dueDate < today;
  }).length;
  
  const offlineAssets = assets.filter(asset => asset.status === 'Inactive' || asset.status === 'Under Maintenance').length;
  
  const totalWorkOrders = workOrders.length;
  const completedWorkOrders = workOrders.filter(wo => wo.status === 'Completed').length;
  const completionRate = totalWorkOrders > 0 ? Math.round((completedWorkOrders / totalWorkOrders) * 100) : 0;

  const maxChartValue = Math.max(...chartData.map(d => d.completed), 1);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your team today.</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card open-work-orders" onClick={() => navigate('/work-orders')}>
          <div className="card-header">
            <div className="card-icon">📋</div>
            <div className="card-trend positive">+2</div>
          </div>
          <div className="card-content">
            <div className="card-number">{openWorkOrders}</div>
            <div className="card-title">Open Work Orders</div>
            <div className="card-subtitle">Active tasks requiring attention</div>
          </div>
          <div className="card-action">
            <span>View all →</span>
          </div>
        </div>

        <div className="summary-card overdue-tasks" onClick={() => navigate('/work-orders')}>
          <div className="card-header">
            <div className="card-icon">⚠️</div>
            <div className="card-trend negative">+1</div>
          </div>
          <div className="card-content">
            <div className="card-number">{overdueTasks}</div>
            <div className="card-title">Overdue Tasks</div>
            <div className="card-subtitle">Tasks past their due date</div>
          </div>
          <div className="card-action">
            <span>Review →</span>
          </div>
        </div>

        <div className="summary-card offline-assets" onClick={() => navigate('/assets')}>
          <div className="card-header">
            <div className="card-icon">🔧</div>
            <div className="card-trend neutral">-1</div>
          </div>
          <div className="card-content">
            <div className="card-number">{offlineAssets}</div>
            <div className="card-title">Assets Offline</div>
            <div className="card-subtitle">Equipment requiring maintenance</div>
          </div>
          <div className="card-action">
            <span>Inspect →</span>
          </div>
        </div>

        <div className="summary-card completion-rate">
          <div className="card-header">
            <div className="card-icon">📈</div>
            <div className="card-trend positive">+5%</div>
          </div>
          <div className="card-content">
            <div className="card-number">{completionRate}%</div>
            <div className="card-title">Completion Rate</div>
            <div className="card-subtitle">Work orders completed</div>
          </div>
          <div className="card-action">
            <span>Details →</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="dashboard-content">
        <div className="chart-section">
          <div className="chart-header">
            <h3>Work Order Completion</h3>
            <p>Completed work orders over the last 7 days</p>
          </div>
          <div className="chart-container">
            <div className="chart">
              {chartData.map((data, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar"
                    style={{ 
                      height: `${(data.completed / maxChartValue) * 100}%`,
                      backgroundColor: '#667eea'
                    }}
                  ></div>
                  <div className="bar-value">{data.completed}</div>
                  <div className="bar-label">{data.date}</div>
                </div>
              ))}
            </div>
            <div className="chart-stats">
              <div className="stat">
                <span className="stat-label">Total this week</span>
                <span className="stat-value">{chartData.reduce((sum, d) => sum + d.completed, 0)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Daily average</span>
                <span className="stat-value">{Math.round(chartData.reduce((sum, d) => sum + d.completed, 0) / 7)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <div className="activity-header">
            <h3>Recent Activity</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <div className="activity-title">Work Order #WO-001 completed</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🔧</div>
              <div className="activity-content">
                <div className="activity-title">Asset "Pump Station A" went offline</div>
                <div className="activity-time">4 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📋</div>
              <div className="activity-content">
                <div className="activity-title">New work order created for Conveyor Belt B</div>
                <div className="activity-time">6 hours ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-content">
                <div className="activity-title">John Smith assigned to WO-005</div>
                <div className="activity-time">8 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <button 
            className="quick-action-btn primary"
            onClick={() => navigate('/work-orders')}
          >
            <span className="action-icon">➕</span>
            <span>New Work Order</span>
          </button>
          <button 
            className="quick-action-btn secondary"
            onClick={() => navigate('/assets')}
          >
            <span className="action-icon">📦</span>
            <span>Add Asset</span>
          </button>
          <button 
            className="quick-action-btn secondary"
            onClick={() => navigate('/work-orders')}
          >
            <span className="action-icon">📊</span>
            <span>View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}