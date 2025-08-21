// API Service for backend communication
const API_BASE_URL = 'http://localhost:3002/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Asset API functions
export const assetAPI = {
  // Get all assets
  getAll: async (params?: Record<string, any>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/assets${queryString}`);
    return handleResponse(response);
  },

  // Get single asset
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`);
    return handleResponse(response);
  },

  // Create new asset
  create: async (assetData: any) => {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assetData),
    });
    return handleResponse(response);
  },

  // Update asset
  update: async (id: string, assetData: any) => {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assetData),
    });
    return handleResponse(response);
  },

  // Delete asset
  delete: async (id: string, deletedById: string) => {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deletedById }),
    });
    return handleResponse(response);
  },
};

// Upload API functions
export const uploadAPI = {
  // Upload files to S3
  uploadFiles: async (files: File[], organizationId: string, uploadedBy: string, assetId?: string) => {
    const formData = new FormData();
    
    // Add files to form data
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add metadata
    formData.append('organizationId', organizationId);
    formData.append('uploadedBy', uploadedBy);
    if (assetId) {
      formData.append('assetId', assetId);
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  // Delete file from asset
  deleteFile: async (assetId: string, fileUrl: string, deletedBy: string) => {
    const response = await fetch(`${API_BASE_URL}/upload/${assetId}/file`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileUrl, deletedBy }),
    });
    return handleResponse(response);
  },

  // Get presigned URL for direct upload
  getPresignedUrl: async (fileName: string, mimeType: string, organizationId: string) => {
    const response = await fetch(`${API_BASE_URL}/upload/presigned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, mimeType, organizationId }),
    });
    return handleResponse(response);
  },

  // Get download URL
  getDownloadUrl: async (fileUrl: string, expiresIn?: number) => {
    const params = new URLSearchParams({ fileUrl });
    if (expiresIn) params.append('expiresIn', expiresIn.toString());
    
    const response = await fetch(`${API_BASE_URL}/upload/download?${params}`);
    return handleResponse(response);
  },
};

// Organization API functions
export const organizationAPI = {
  // Get all organizations
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/organizations`);
    return handleResponse(response);
  },

  // Get single organization
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/organizations/${id}`);
    return handleResponse(response);
  },

  // Create organization
  create: async (organizationData: any) => {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizationData),
    });
    return handleResponse(response);
  },

  // Update organization
  update: async (id: string, organizationData: any) => {
    const response = await fetch(`${API_BASE_URL}/organizations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizationData),
    });
    return handleResponse(response);
  },
};

// User API functions
export const userAPI = {
  // Get all users
  getAll: async (organizationId?: string) => {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    const response = await fetch(`${API_BASE_URL}/users${params}`);
    return handleResponse(response);
  },

  // Get current user
  getCurrent: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`);
    return handleResponse(response);
  },

  // Create or update user
  upsert: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
};

// Work Order API functions
export const workOrderAPI = {
  // Get all work orders
  getAll: async (params?: Record<string, any>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/work-orders${queryString}`);
    return handleResponse(response);
  },

  // Get single work order
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/work-orders/${id}`);
    return handleResponse(response);
  },

  // Create work order
  create: async (workOrderData: any) => {
    const response = await fetch(`${API_BASE_URL}/work-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workOrderData),
    });
    return handleResponse(response);
  },

  // Update work order
  update: async (id: string, workOrderData: any) => {
    const response = await fetch(`${API_BASE_URL}/work-orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workOrderData),
    });
    return handleResponse(response);
  },

  // Add comment to work order
  addComment: async (workOrderId: string, content: string, authorId: string, type: string = 'COMMENT') => {
    const response = await fetch(`${API_BASE_URL}/work-orders/${workOrderId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, authorId, type }),
    });
    return handleResponse(response);
  },
};