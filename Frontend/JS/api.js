// API Helper Functions

/**
 * Generic fetch wrapper for API calls
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options (method, body, etc)
 * @returns {Promise} - API response
 */
async function apiCall(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    
    const headers = {
        ...API_CONFIG.HEADERS,
        ...options.headers
    };

    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
        ...options,
        headers
    };

    // Convert object body to JSON string
    if (fetchOptions.body && typeof fetchOptions.body === 'object') {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    try {
        const response = await Promise.race([
            fetch(url, fetchOptions),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.TIMEOUT)
            )
        ]);

        // Check if response is ok
        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - clear token and redirect to login
                clearAuthToken();
                window.location.href = 'pages/Cliente/login.html';
                throw new Error(MESSAGES.ERROR.SESSION_EXPIRED);
            }

            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || MESSAGES.ERROR.GENERIC_ERROR);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        devLog('API Error:', error);
        throw error;
    }
}

/**
 * GET request
 */
async function apiGet(endpoint, params = {}) {
    const queryString = new URLSearchParams(params);
    const fullEndpoint = queryString.toString() 
        ? `${endpoint}?${queryString}` 
        : endpoint;

    return apiCall(fullEndpoint, {
        method: 'GET'
    });
}

/**
 * POST request
 */
async function apiPost(endpoint, data = {}) {
    return apiCall(endpoint, {
        method: 'POST',
        body: data
    });
}

/**
 * PUT request
 */
async function apiPut(endpoint, data = {}) {
    return apiCall(endpoint, {
        method: 'PUT',
        body: data
    });
}

/**
 * PATCH request
 */
async function apiPatch(endpoint, data = {}) {
    return apiCall(endpoint, {
        method: 'PATCH',
        body: data
    });
}

/**
 * DELETE request
 */
async function apiDelete(endpoint) {
    return apiCall(endpoint, {
        method: 'DELETE'
    });
}

// ==================== Auth API Calls ====================

async function apiLogin(email, password) {
    return apiPost(ENDPOINTS.AUTH.LOGIN, {
        email,
        password
    });
}

async function apiRegister(userData) {
    return apiPost(ENDPOINTS.AUTH.REGISTER, userData);
}

async function apiLogout() {
    return apiPost(ENDPOINTS.AUTH.LOGOUT);
}

async function apiVerifyToken() {
    return apiGet(ENDPOINTS.AUTH.VERIFY_TOKEN);
}

// ==================== Vehicle API Calls ====================

async function apiGetVehicles(params = {}) {
    return apiGet(ENDPOINTS.VEHICLES.LIST, params);
}

async function apiGetVehicle(id) {
    return apiGet(ENDPOINTS.VEHICLES.GET.replace(':id', id));
}

async function apiSearchVehicles(searchData) {
    return apiPost(ENDPOINTS.VEHICLES.SEARCH, searchData);
}

async function apiFilterVehicles(filters) {
    return apiGet(ENDPOINTS.VEHICLES.FILTER, filters);
}

// ==================== Reservation API Calls ====================

async function apiCreateReservation(reservationData) {
    return apiPost(ENDPOINTS.RESERVATIONS.CREATE, reservationData);
}

async function apiGetReservations(params = {}) {
    return apiGet(ENDPOINTS.RESERVATIONS.LIST, params);
}

async function apiGetReservation(id) {
    return apiGet(ENDPOINTS.RESERVATIONS.GET.replace(':id', id));
}

async function apiUpdateReservation(id, reservationData) {
    return apiPut(ENDPOINTS.RESERVATIONS.UPDATE.replace(':id', id), reservationData);
}

async function apiCancelReservation(id, reason = '') {
    return apiPost(ENDPOINTS.RESERVATIONS.CANCEL.replace(':id', id), { reason });
}

// ==================== User API Calls ====================

async function apiGetUserProfile() {
    return apiGet(ENDPOINTS.USERS.PROFILE);
}

async function apiUpdateUserProfile(userData) {
    return apiPut(ENDPOINTS.USERS.UPDATE, userData);
}

async function apiGetUserReservations() {
    return apiGet(ENDPOINTS.USERS.GET_RESERVATIONS);
}
