import apiClient from '@/layout/composables/apiClientConfigure'

export default {
  // get user by employeeId
  getUserInfo(data) {
    return apiClient.post('/api/v1/user/getByEmployeeId', data, { showSpinner: false })
  },

  // get user profile
  updateProfile(data) {
    return apiClient.put('/profile', data)
  },

  // get all users
  getAllUsers(data) {
    return apiClient.post('/api/v1/user/getAllAsPage', data, { showSpinner: false })
  },

  // get all menus
  getAllMenus() {
    return apiClient.post('/api/v1/menus', undefined, { showSpinner: false })
  },

  // get all roles
  getAllRoles() {
    return apiClient.post('/api/v1/userPermission/getAllAsPage', {
      pageNumber: 1,
      size: 1000,
      sortBy: "desc"
    }, { showSpinner: false })
  },

  // handle user creation
  createUser(data) {
    const dataToSave = {
      employeeId: data?.employeeId,
      username: data?.username,
      email: data?.email,
      password: "123",
      roleIds: Array.isArray(data?.roles) && data.roles ? data.roles.map((role) => role.id) : [],
      menuIds: Array.isArray(data?.menus) && data.menus ? data.menus.map((menu) => menu.id) : [],
    }
    return apiClient.post('/api/v1/user/save', dataToSave)
  },
  // handle user update
  updateUser(data) {
    const dataToUpdate = {
      employeeId: data?.employeeId,
      username: data?.username,
      email: data?.email,
      isActive: true,
      roleIds: Array.isArray(data?.roles) && data.roles ? data.roles : [],
      menuIds: Array.isArray(data?.menus) && data.menus ? data.menus : [],
    }
    return apiClient.post('/api/v1/user/update', dataToUpdate)
  },
  // handle user deletion
  deleteUser(data) {
    return apiClient.post('/api/v1/user/delete', data)
  },

  // handle filter user
  searchUser(params, data) {
    return apiClient.post('/api/v1/user/searchUser', data, { params, showSpinner: false })
  },

  // handle encrypt
  encryptText(data) {
    return apiClient.post('/encrypt', data, { showSpinner: false })
  },

  // handle encrypt
  decryptText(data) {
    return apiClient.post('/decrypt', data, { showSpinner: false })
  }

}
