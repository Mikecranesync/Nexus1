import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const industries: Industry[] = [
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: '🏭',
    description: 'Production and industrial operations'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Medical services and patient care'
  },
  {
    id: 'public-sector',
    name: 'Public Sector',
    icon: '🏛️',
    description: 'Government and public services'
  },
  {
    id: 'technology',
    name: 'Technology',
    icon: '💻',
    description: 'Software and IT services'
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '🏦',
    description: 'Banking and financial services'
  },
  {
    id: 'education',
    name: 'Education',
    icon: '🎓',
    description: 'Schools and educational institutions'
  },
  {
    id: 'retail',
    name: 'Retail',
    icon: '🛍️',
    description: 'Commerce and consumer goods'
  },
  {
    id: 'consulting',
    name: 'Consulting',
    icon: '💼',
    description: 'Professional services and advisory'
  }
];

export function OrganizationSetup() {
  const [organizationName, setOrganizationName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (organizationName.trim() && selectedIndustry) {
      // Save organization setup data
      const orgData = {
        name: organizationName.trim(),
        industry: selectedIndustry,
        setupCompletedAt: new Date().toISOString()
      };
      
      localStorage.setItem('organizationSetup', JSON.stringify(orgData));
      
      // Navigate to main app
      navigate('/');
    }
  };

  const isFormValid = organizationName.trim().length > 0 && selectedIndustry !== null;

  return (
    <div className="page-container">
      <div className="setup-card">
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '0.5rem', 
          color: '#1f1f1f',
          textAlign: 'center'
        }}>
          Welcome! Let's Set Up Your Organization
        </h1>
        
        <p style={{ 
          color: '#666', 
          textAlign: 'center', 
          marginBottom: '2rem',
          fontSize: '1rem'
        }}>
          Help us customize your Nexus experience
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label 
              htmlFor="orgName"
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '1rem'
              }}
            >
              Organization Name *
            </label>
            <input
              id="orgName"
              type="text"
              placeholder="Enter your organization's name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="mobile-input touch-target"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#646cff'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              required
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '1rem', 
              fontWeight: '600',
              color: '#333',
              fontSize: '1rem'
            }}>
              Select Your Industry *
            </label>
            
            <div className="industry-grid">
              {industries.map((industry) => (
                <div
                  key={industry.id}
                  className={`industry-card ${selectedIndustry === industry.id ? 'selected' : ''}`}
                  onClick={() => setSelectedIndustry(industry.id)}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: selectedIndustry === industry.id 
                      ? '3px solid #646cff' 
                      : '2px solid #e0e0e0',
                    backgroundColor: selectedIndustry === industry.id 
                      ? '#f8f9ff' 
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    minHeight: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>{industry.icon}</div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: selectedIndustry === industry.id ? '#646cff' : '#333',
                    fontSize: '0.9rem'
                  }}>
                    {industry.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#666',
                    lineHeight: '1.2'
                  }}>
                    {industry.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mobile-button touch-target"
            disabled={!isFormValid}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              backgroundColor: isFormValid ? '#646cff' : '#ccc',
              opacity: isFormValid ? 1 : 0.6,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}