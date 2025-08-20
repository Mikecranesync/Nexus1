import { useState } from 'react';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: string;
}

interface StepDetail {
  id: string;
  title: string;
  description: string;
  options: {
    id: string;
    title: string;
    description: string;
    icon: string;
    action: string;
  }[];
}

const checklistSteps: ChecklistStep[] = [
  {
    id: 'create-work-order',
    title: 'Create a Work Order',
    description: 'Start by creating your first work order to track maintenance tasks',
    completed: false,
    icon: '📝'
  },
  {
    id: 'add-asset',
    title: 'Add an Asset',
    description: 'Register equipment and assets that need to be maintained',
    completed: false,
    icon: '🏭'
  },
  {
    id: 'schedule-maintenance',
    title: 'Schedule Maintenance',
    description: 'Set up recurring maintenance schedules for your assets',
    completed: false,
    icon: '📅'
  },
  {
    id: 'invite-team',
    title: 'Invite Team Members',
    description: 'Add team members to collaborate on maintenance tasks',
    completed: false,
    icon: '👥'
  },
  {
    id: 'setup-notifications',
    title: 'Setup Notifications',
    description: 'Configure alerts for overdue tasks and upcoming maintenance',
    completed: false,
    icon: '🔔'
  }
];

const stepDetails: Record<string, StepDetail> = {
  'create-work-order': {
    id: 'create-work-order',
    title: 'Create Your First Work Order',
    description: 'Work orders help you track and manage maintenance tasks. Choose from these common types to get started:',
    options: [
      {
        id: 'daily-inspection',
        title: 'Daily Inspection',
        description: 'Routine checks to ensure equipment is operating properly',
        icon: '🔍',
        action: 'Create Daily Inspection'
      },
      {
        id: 'repair-asset',
        title: 'Repair Asset',
        description: 'Fix broken equipment or address maintenance issues',
        icon: '🔧',
        action: 'Create Repair Order'
      },
      {
        id: 'preventive-maintenance',
        title: 'Preventive Maintenance',
        description: 'Scheduled maintenance to prevent equipment failures',
        icon: '⚙️',
        action: 'Schedule Maintenance'
      }
    ]
  },
  'add-asset': {
    id: 'add-asset',
    title: 'Register Your Assets',
    description: 'Add equipment and assets to your inventory for better tracking and maintenance management:',
    options: [
      {
        id: 'equipment',
        title: 'Production Equipment',
        description: 'Machines, tools, and production line equipment',
        icon: '🏭',
        action: 'Add Equipment'
      },
      {
        id: 'facility',
        title: 'Facility Assets',
        description: 'Buildings, HVAC systems, lighting, and infrastructure',
        icon: '🏢',
        action: 'Add Facility Asset'
      },
      {
        id: 'vehicle',
        title: 'Vehicles & Fleet',
        description: 'Company vehicles, forklifts, and mobile equipment',
        icon: '🚛',
        action: 'Add Vehicle'
      }
    ]
  },
  'schedule-maintenance': {
    id: 'schedule-maintenance',
    title: 'Setup Maintenance Schedules',
    description: 'Create recurring maintenance schedules to keep your assets in optimal condition:',
    options: [
      {
        id: 'weekly',
        title: 'Weekly Maintenance',
        description: 'Regular weekly checks and basic maintenance tasks',
        icon: '📅',
        action: 'Setup Weekly Schedule'
      },
      {
        id: 'monthly',
        title: 'Monthly Maintenance',
        description: 'Comprehensive monthly inspections and servicing',
        icon: '🗓️',
        action: 'Setup Monthly Schedule'
      },
      {
        id: 'quarterly',
        title: 'Quarterly Reviews',
        description: 'In-depth quarterly maintenance and performance reviews',
        icon: '📊',
        action: 'Setup Quarterly Reviews'
      }
    ]
  },
  'invite-team': {
    id: 'invite-team',
    title: 'Build Your Maintenance Team',
    description: 'Collaborate with team members by inviting them to your workspace:',
    options: [
      {
        id: 'technicians',
        title: 'Maintenance Technicians',
        description: 'Field workers who perform hands-on maintenance tasks',
        icon: '👷',
        action: 'Invite Technicians'
      },
      {
        id: 'supervisors',
        title: 'Supervisors & Managers',
        description: 'Team leads who oversee maintenance operations',
        icon: '👔',
        action: 'Invite Supervisors'
      },
      {
        id: 'operators',
        title: 'Equipment Operators',
        description: 'Staff who operate equipment and report issues',
        icon: '👨‍🔧',
        action: 'Invite Operators'
      }
    ]
  },
  'setup-notifications': {
    id: 'setup-notifications',
    title: 'Configure Notifications',
    description: 'Stay informed about important maintenance events and deadlines:',
    options: [
      {
        id: 'overdue-alerts',
        title: 'Overdue Task Alerts',
        description: 'Get notified when maintenance tasks are overdue',
        icon: '🚨',
        action: 'Setup Overdue Alerts'
      },
      {
        id: 'upcoming-maintenance',
        title: 'Upcoming Maintenance',
        description: 'Reminders for scheduled maintenance activities',
        icon: '⏰',
        action: 'Setup Reminders'
      },
      {
        id: 'completion-notifications',
        title: 'Task Completion',
        description: 'Notifications when team members complete tasks',
        icon: '✅',
        action: 'Setup Completion Alerts'
      }
    ]
  }
};

export function GettingStarted() {
  const [selectedStep, setSelectedStep] = useState<string>('create-work-order');
  const [steps, setSteps] = useState<ChecklistStep[]>(checklistSteps);

  const handleStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const handleStartAction = (stepId: string, actionType: string) => {
    console.log(`Starting action: ${actionType} for step: ${stepId}`);
    handleStepComplete(stepId);
    // Here you would typically navigate to the actual feature
    alert(`Starting: ${actionType}\n\nThis would navigate to the actual feature in a complete application.`);
  };

  const currentDetail = stepDetails[selectedStep];
  const completedCount = steps.filter(step => step.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  return (
    <div className="page-container">
      <div className="getting-started-header">
        <h1>Getting Started</h1>
        <p>Complete these steps to set up your maintenance management system</p>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="progress-text">{completedCount} of {steps.length} completed</span>
        </div>
      </div>

      <div className="getting-started-content">
        <div className="steps-sidebar">
          <h3>Setup Steps</h3>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`step-item ${selectedStep === step.id ? 'active' : ''} ${step.completed ? 'completed' : ''}`}
              onClick={() => setSelectedStep(step.id)}
            >
              <div className="step-number">
                {step.completed ? '✓' : index + 1}
              </div>
              <div className="step-content">
                <div className="step-icon">{step.icon}</div>
                <div className="step-info">
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="step-details">
          {currentDetail && (
            <>
              <div className="detail-header">
                <h2>{currentDetail.title}</h2>
                <p>{currentDetail.description}</p>
              </div>

              <div className="options-grid">
                {currentDetail.options.map((option) => (
                  <div key={option.id} className="option-card">
                    <div className="option-icon">{option.icon}</div>
                    <div className="option-content">
                      <h3>{option.title}</h3>
                      <p>{option.description}</p>
                    </div>
                    <button
                      className="start-button"
                      onClick={() => handleStartAction(selectedStep, option.action)}
                    >
                      Start here
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}