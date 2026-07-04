/**
 * Centralized API Configuration with Enhanced Error Handling
 *
 * Features:
 * - Request ID tracking
 * - Automatic retry on transient errors
 * - Global error logging
 * - Token management
 * - Error response standardization
 */

import axios from "axios"
import { logErrorToBackend, shouldRetry, getRetryDelay } from "../utils/errorHandler"

// Use Vite proxy (same origin) to avoid CORS issues
// All /api requests are proxied to Flask in vite.config.js
const getBaseURL = () => ''

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 30000
})

// Store for retried requests (to avoid infinite retries)
const retryCount = new WeakMap()

// REQUEST INTERCEPTOR - Add token and request ID
api.interceptors.request.use((config) => {
    // Add token
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    // Add request ID for tracking
    config.headers["X-Request-ID"] = generateRequestId()

    return config
})

// RESPONSE INTERCEPTOR - Handle errors with retry logic and logging
api.interceptors.response.use(
    (response) => {
        // Success - clear retry count
        retryCount.delete(response.config)
        return response
    },
    async (error) => {
        const config = error.config

        // Initialize retry count for this request
        if (!retryCount.has(config)) {
            retryCount.set(config, 0)
        }

        const currentRetry = retryCount.get(config)

        // Handle 401 - Token expired
        if (error.response?.status === 401) {
            // Only redirect if not already retrying
            if (currentRetry === 0) {
                clearAuthTokens()
                window.location.href = "/login"
            }
            return Promise.reject(error)
        }

        // Handle 403 - Forbidden
        if (error.response?.status === 403) {
            logErrorToBackend(error, "APIInterceptor:Forbidden", {
                endpoint: config.url,
                method: config.method
            })
            return Promise.reject(error)
        }

        // Handle transient errors with retry logic
        if (shouldRetry(error, currentRetry, 3)) {
            const delay = getRetryDelay(currentRetry)
            const newRetryCount = currentRetry + 1

            // Update retry count
            retryCount.set(config, newRetryCount)

            // Wait before retrying
            await sleep(delay)

            // Retry the request
            return api.request(config)
        }

        // Non-transient error or max retries exceeded - log and reject
        logErrorToBackend(error, "APIInterceptor:Error", {
            endpoint: config.url,
            method: config.method,
            retryAttempt: currentRetry,
            statusCode: error.response?.status
        })

        return Promise.reject(error)
    }
)

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clear authentication tokens from localStorage
 */
function clearAuthTokens() {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("role")
    localStorage.removeItem("username")
    localStorage.removeItem("passwordChangeRequired")
}

/**
 * Sleep utility for delays
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export default api
export { getBaseURL, generateRequestId, clearAuthTokens }