import axios from 'axios'
import { useAuthStore } from '@/service/AuthService'
import { useLayout } from '@/layout/composables/layout'


const apiClient = axios.create({})

apiClient.interceptors.request.use(
  (config) => {

    const authStore = useAuthStore()
    const token = authStore.token
    const layoutConfig = useLayout()


    if (token) {
      config.headers.Authorization = token
    }

    if (config.showSpinner === false) {
      layoutConfig.isSpinnerLoading.isLoading = false;
    } else {
      // is loading
      layoutConfig.isSpinnerLoading.isLoading = true;
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
apiClient.interceptors.response.use(
  (response) => {
    const layoutConfig = useLayout()
    layoutConfig.isSpinnerLoading.isLoading = false;
    return response;
  },
  (error) => {
    const layoutConfig = useLayout()
    layoutConfig.isSpinnerLoading.isLoading = false;
    return Promise.reject(error);
  }
);

export default apiClient
