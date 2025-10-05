import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import apiClient from '@/layout/composables/apiClientConfigure'

const authState = reactive({
  userInfoStat: false
}
)

export const useAuthStore = defineStore('auth', () => {
  // state
  const token = ref(localStorage.getItem('userToken'))
  const employeeId = ref(localStorage.getItem('employeeId'))

  // getters
  const isAuthenticated = computed(() => !!token.value);


  const user = computed(() => {
    const userInfo = localStorage.getItem('userInfo');
    const jsonUserInfo = JSON.parse(userInfo);
    return jsonUserInfo.data.username;
  });

  function updateUserInfoStat() {
    authState.userInfoStat = !authState.userInfoStat
  }

  // actions
  function setToken(tokenValue) {
    localStorage.setItem('userToken', tokenValue)
    token.value = tokenValue
  }

  function setUser(userValue) {
    localStorage.setItem('userInfo', JSON.stringify(userValue))
    employeeId.value = userValue
  }

  function logout() {
    localStorage.removeItem('userToken')
    localStorage.removeItem('user')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('employeeId')

    token.value = null
    employeeId.value = null
  }
  async function login(credentials) {

    const response = await apiClient.post('/api/login', credentials);
    const resData = response.data;

    //setToken(resData.token);

    return resData;
  }
  async function getUserInfoFromLocalStorage() {
    try {
      const userInfoString = localStorage.getItem('userInfo')
      if (userInfoString && userInfoString !== '') {
        return JSON.parse(userInfoString)
      } else {
        return null
      }
    } catch (e) {
      console.error('Error parsing user info from localStorage:', e)
      return null
    }
  }
  const userInfoStatus = computed(() => authState.userInfoStat);

  return { token, user, isAuthenticated, userInfoStatus, setToken, setUser, logout, login, setUserInfoStat: updateUserInfoStat, getUserInfoFromLocalStorage }
})
