import apiClient from './apiClient';

export const getMyPackages  = (params = {}) => apiClient.get('/resident/packages',  { params }).then(r => r.data);
export const getMyVehicles  = ()             => apiClient.get('/resident/vehicles').then(r => r.data);
export const getCommonAreas = (params = {})  => apiClient.get('/resident/common-areas', { params }).then(r => r.data);
export const getEvents      = (params = {})  => apiClient.get('/resident/events',   { params }).then(r => r.data);

// Visitantes
export const getMyVisitors   = ()       => apiClient.get('/resident/visitors').then(r => r.data);
export const registerVisitor = (data)   => apiClient.post('/resident/visitors', data).then(r => r.data);
export const cancelVisitor   = (id)     => apiClient.patch(`/resident/visitors/${id}/cancel`).then(r => r.data);
export const searchVisitors  = (params) => apiClient.get('/resident/visitors/search', { params }).then(r => r.data);