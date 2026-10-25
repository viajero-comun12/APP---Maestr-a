/**
 * API Service Client - Plataforma de Cursos Preparatorios de Maestría
 * Conexión completa con el backend en FastAPI (http://127.0.0.1:8000/api/v1)
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

class ApiService {
  getToken() {
    return localStorage.getItem('maestria_token');
  }

  setToken(token) {
    localStorage.setItem('maestria_token', token);
  }

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('maestria_user')) || null;
    } catch {
      return null;
    }
  }

  setUser(user) {
    localStorage.setItem('maestria_user', JSON.stringify(user));
  }

  clearAuth() {
    localStorage.removeItem('maestria_token');
    localStorage.removeItem('maestria_user');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = options.headers || {};
    const token = this.getToken();

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Token expirado o inválido
        this.clearAuth();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
      }

      if (!response.ok) {
        let errorDetail = 'Error al procesar la solicitud';
        try {
          const errData = await response.json();
          errorDetail = errData.detail || errorDetail;
        } catch {
          errorDetail = response.statusText || errorDetail;
        }
        throw new Error(errorDetail);
      }

      // Si la respuesta es un archivo para descarga directa
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf') || 
          contentType.includes('application/vnd.openxmlformats') ||
          contentType.includes('application/octet-stream')) {
        return response.blob();
      }

      return await response.json();
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // Helper para descargar archivos en el navegador
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  /* ================= Auth ================= */
  async login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const data = await this.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    this.setToken(data.access_token);
    this.setUser({
      id: data.user_id,
      email: data.email,
      fullName: data.full_name,
      role: data.role
    });

    return data;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    const updated = await this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    // Actualizar usuario en storage local
    const current = this.getUser();
    if (current) {
      this.setUser({ ...current, fullName: updated.full_name });
    }
    return updated;
  }

  /* ================= Dashboard ================= */
  async getDashboardMetrics() {
    return this.request('/dashboard/metrics');
  }

  /* ================= Programas y Cursos ================= */
  async getPrograms() {
    return this.request('/programs/');
  }

  async getProgramById(id) {
    return this.request(`/programs/${id}`);
  }

  async createProgram(programData) {
    return this.request('/programs/', {
      method: 'POST',
      body: JSON.stringify(programData)
    });
  }

  async addCourse(programId, courseData) {
    return this.request(`/programs/${programId}/courses`, {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  }

  async addActivity(courseId, activityData) {
    return this.request(`/programs/courses/${courseId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  }

  /* ================= Inscripciones y Postulantes ================= */
  async getEnrollments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.program_id) params.append('program_id', filters.program_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.risk_level) params.append('risk_level', filters.risk_level);
    if (filters.tutor_id) params.append('tutor_id', filters.tutor_id);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/enrollments/${qs}`);
  }

  async getMyProgress() {
    return this.request('/enrollments/me');
  }

  async getEnrollmentById(id) {
    return this.request(`/enrollments/${id}`);
  }

  async enroll(programId) {
    return this.request('/enrollments/', {
      method: 'POST',
      body: JSON.stringify({ program_id: programId })
    });
  }

  async assignTutor(enrollmentId, tutorId) {
    return this.request(`/enrollments/${enrollmentId}/assign-tutor`, {
      method: 'PUT',
      body: JSON.stringify({ tutor_id: tutorId })
    });
  }

  async getTutors() {
    return this.request('/users/tutors');
  }

  /* ================= Evidencias ================= */
  async uploadEvidence(enrollmentId, activityId, file, observations = '') {
    const formData = new FormData();
    formData.append('enrollment_id', enrollmentId);
    formData.append('activity_id', activityId);
    formData.append('file', file);
    if (observations) {
      formData.append('observations', observations);
    }

    return this.request('/evidences/upload', {
      method: 'POST',
      body: formData
    });
  }

  async getEvidencesForEnrollment(enrollmentId) {
    return this.request(`/evidences/enrollment/${enrollmentId}`);
  }

  async reviewEvidence(evidenceId, reviewData) {
    return this.request(`/evidences/${evidenceId}/review`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
  }

  /* ================= Seguimiento y Tutoría ================= */
  async createTrackingRecord(trackingData) {
    return this.request('/tracking/', {
      method: 'POST',
      body: JSON.stringify(trackingData)
    });
  }

  async getTrackingsForEnrollment(enrollmentId) {
    return this.request(`/tracking/enrollment/${enrollmentId}`);
  }

  async getTimeline(enrollmentId) {
    return this.request(`/tracking/timeline/${enrollmentId}`);
  }

  /* ================= Alertas ================= */
  async checkDeadlines() {
    return this.request('/alerts/check-deadlines', {
      method: 'POST'
    });
  }

  async getNotifications(userId = null) {
    const qs = userId ? `?user_id=${userId}` : '';
    return this.request(`/alerts/notifications${qs}`);
  }

  /* ================= Reportes ================= */
  async downloadApplicantPdf(enrollmentId, applicantName = 'Postulante') {
    const blob = await this.request(`/reports/applicant/${enrollmentId}/pdf`);
    const clean = applicantName.replace(/\s+/g, '_');
    this.downloadBlob(blob, `Reporte_Individual_${clean}_${enrollmentId}.pdf`);
  }

  async downloadConsolidatedMatrixExcel() {
    const blob = await this.request('/reports/consolidated-matrix/excel');
    this.downloadBlob(blob, 'Matriz_Consolidada_Seguimiento.xlsx');
  }

  async downloadConsolidatedMatrixPdf() {
    const blob = await this.request('/reports/consolidated-matrix/pdf');
    this.downloadBlob(blob, 'Matriz_Consolidada_Seguimiento.pdf');
  }

  async downloadTraceabilityExcel() {
    const blob = await this.request('/reports/traceability/excel');
    this.downloadBlob(blob, 'Informe_Trazabilidad_Acciones.xlsx');
  }

  async downloadTraceabilityPdf() {
    const blob = await this.request('/reports/traceability/pdf');
    this.downloadBlob(blob, 'Informe_Trazabilidad_Acciones.pdf');
  }
}

export const api = new ApiService();
