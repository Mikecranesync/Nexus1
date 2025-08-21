import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface MachineFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  url?: string;
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  temperature?: number;
  uptime?: number;
  efficiency?: number;
  modelNumber?: string;
  serialNumber?: string;
  manufacturer?: string;
  installationDate?: string;
  description?: string;
  files?: MachineFile[];
  createdAt: string;
  updatedAt: string;
}

export interface MachineCreateRequest {
  name: string;
  type: string;
  location: string;
}

export interface MachineUpdateRequest {
  name?: string;
  type?: string;
  location?: string;
  status?: Machine['status'];
}

class MachineService {
  async getMachines(): Promise<Machine[]> {
    try {
      const response = await api.get<Machine[]>('/api/machines');
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch machines. Please try again.');
    }
  }

  async getMachine(id: string): Promise<Machine> {
    try {
      const response = await api.get<Machine>(`/api/machines/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch machine details. Please try again.');
    }
  }

  async createMachine(machineData: MachineCreateRequest): Promise<Machine> {
    try {
      const response = await api.post<Machine>('/api/machines', machineData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create machine. Please try again.');
    }
  }

  async updateMachine(id: string, machineData: MachineUpdateRequest): Promise<Machine> {
    try {
      const response = await api.put<Machine>(`/api/machines/${id}`, machineData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update machine. Please try again.');
    }
  }

  async deleteMachine(id: string): Promise<void> {
    try {
      await api.delete(`/api/machines/${id}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete machine. Please try again.');
    }
  }

  async getMachineStats(id: string): Promise<any> {
    try {
      const response = await api.get(`/api/machines/${id}/stats`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch machine statistics. Please try again.');
    }
  }

  async uploadFiles(machineId: string, files: File[], onProgress?: (progress: number) => void): Promise<MachineFile[]> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.post<MachineFile[]>(`/api/machines/${machineId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to upload files. Please try again.');
    }
  }

  async deleteFile(machineId: string, fileId: string): Promise<void> {
    try {
      await api.delete(`/api/machines/${machineId}/files/${fileId}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete file. Please try again.');
    }
  }
}

const machineService = new MachineService();
export default machineService;