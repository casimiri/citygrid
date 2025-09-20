import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('access_token')
      Cookies.remove('org_id')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  getProfile: () => api.get('/auth/profile'),
  getMemberships: () => api.get('/auth/memberships'),
}

export const orgAPI = {
  getCurrent: () => api.get('/org'),
  getMembers: () => api.get('/org/members'),
}

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id: string) => api.get(`/projects/${id}`),
}

export const referentielAPI = {
  getCategories: () => api.get('/referentiel/categories'),
  getTypes: (categoryId?: string) => 
    api.get('/referentiel/types', { params: { categoryId } }),
  getThresholds: () => api.get('/referentiel/thresholds'),
  checkConformity: (data: any) => api.post('/referentiel/checks/conformity', data),
}

export const analyticsAPI = {
  getCoverage: () => api.get('/analytics/coverage'),
  getDashboard: () => api.get('/analytics/dashboard'),
}

export const administrativeAPI = {
  getLevels: (stateId: string) => api.get(`/administrative/states/${stateId}/levels`),
  createLevel: (stateId: string, data: any) => api.post(`/administrative/states/${stateId}/levels`, data),
  updateLevel: (stateId: string, levelId: string, data: any) => api.put(`/administrative/states/${stateId}/levels/${levelId}`, data),
  deleteLevel: (stateId: string, levelId: string) => api.delete(`/administrative/states/${stateId}/levels/${levelId}`),
  getTree: (stateId: string) => api.get(`/administrative/states/${stateId}/tree`),
  createNode: (stateId: string, data: any) => api.post(`/administrative/states/${stateId}/nodes`, data),
  getNode: (nodeId: string) => api.get(`/administrative/nodes/${nodeId}`),
  updateNode: (nodeId: string, data: any) => api.put(`/administrative/nodes/${nodeId}`, data),
  deleteNode: (nodeId: string) => api.delete(`/administrative/nodes/${nodeId}`),
  getNodeChildren: (nodeId: string) => api.get(`/administrative/nodes/${nodeId}/children`),
  getNodeHierarchy: (nodeId: string) => api.get(`/administrative/nodes/${nodeId}/hierarchy`),
  getNodeSubtree: (nodeId: string) => api.get(`/administrative/nodes/${nodeId}/subtree`),
  getNodeProjects: (nodeId: string, includeChildren = false) => 
    api.get(`/administrative/nodes/${nodeId}/projects?includeChildren=${includeChildren}`),
  assignUserToNode: (nodeId: string, data: any) => api.post(`/administrative/nodes/${nodeId}/users`, data),
  getUserAdministrativeNodes: (stateId: string, userId: string) => 
    api.get(`/administrative/states/${stateId}/users/${userId}/nodes`),
}