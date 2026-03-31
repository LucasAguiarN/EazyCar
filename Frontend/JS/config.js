// Configuration file for EazyCar Frontend

// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000/api' || 'http://127.0.0.1:5000/api',
    TIMEOUT: 10000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// App Configuration
const APP_CONFIG = {
    APP_NAME: 'EazyCar',
    VERSION: '1.0.0',
    THEME: 'light',
    LANGUAGE: 'pt-BR'
};

// Local Storage Keys
const STORAGE_KEYS = {
    TOKEN: 'eazycar_token',
    USER: 'eazycar_user',
    SEARCH_DATA: 'carSearchData',
    PREFERENCES: 'eazycar_preferences'
};

// API Endpoints
const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        VERIFY_TOKEN: '/auth/verify'
    },
    VEHICLES: {
        LIST: '/vehicles',
        GET: '/vehicles/:id',
        SEARCH: '/vehicles/search',
        FILTER: '/vehicles/filter'
    },
    RESERVATIONS: {
        CREATE: '/reservations',
        LIST: '/reservations',
        GET: '/reservations/:id',
        UPDATE: '/reservations/:id',
        CANCEL: '/reservations/:id/cancel'
    },
    USERS: {
        PROFILE: '/users/profile',
        UPDATE: '/users/profile',
        GET_RESERVATIONS: '/users/reservations'
    }
};

// Notification messages
const MESSAGES = {
    SUCCESS: {
        RESERVATION_CREATED: 'Reserva criada com sucesso!',
        LOGIN_SUCCESS: 'Bem-vindo!',
        UPDATE_SUCCESS: 'Dados atualizados com sucesso!'
    },
    ERROR: {
        NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
        INVALID_LOGIN: 'Usuário ou senha inválidos.',
        SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
        VALIDATION_ERROR: 'Verifique os dados e tente novamente.',
        GENERIC_ERROR: 'Ocorreu um erro. Tente novamente.'
    },
    WARNING: {
        UNSAVED_CHANGES: 'Você tem alterações não salvas.'
    }
};

// Utility function to get API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}

// Utility function to get auth token
function getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

// Utility function to set auth token
function setAuthToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

// Utility function to clear auth token
function clearAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

// Utility function to get user from storage
function getStoredUser() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
}

// Utility function to set user in storage
function setStoredUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

// Utility function to check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Utility function to check if user is admin
function isAdmin() {
    const user = getStoredUser();
    return user && user.role === 'admin';
}

// Console log only in development
function devLog(message, data = null) {
    if (APP_CONFIG.VERSION.includes('dev')) {
        console.log(`[${APP_CONFIG.APP_NAME}] ${message}`, data || '');
    }
}
