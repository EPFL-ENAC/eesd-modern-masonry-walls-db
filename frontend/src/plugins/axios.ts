import axios from 'axios'

// The one HTTP client: every call goes through a module in src/api/.
export const http = axios.create({ baseURL: import.meta.env.VITE_APP_BACKEND_URL })
