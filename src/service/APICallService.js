import apiClient from '@/layout/composables/apiClientConfigure' // <-- Import our configured instance!

export default {
  v_api_call(data) {
    return apiClient.post('/api/v1/call/procedureOrFunction', data)
  }
}
