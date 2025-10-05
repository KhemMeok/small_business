<script setup>
import { ref, onMounted, watch } from 'vue'
import UserService from '@/service/UserService'
import { Password, Tag } from 'primevue'
import { useToastNotification } from '@/layout/composables/useToastNotification'
import { useDebounceFn } from '@vueuse/core'

const users = ref([])
const menus = ref([])
const roles = ref([])
const dt = ref(null)
const { alertSuccess, alertError } = useToastNotification()

const loading = ref(false)
const selectedUsers = ref()
const rowsPerPage = ref(5)
const first = ref(0)
const totalRecords = ref(0)
const selectedPageNumber = ref(1)
const userToDelete = ref(null)
const searchString = ref('')

// Dialog state
const userDetailDialog = ref(false)
const newUserDialog = ref(false)
const editUserDialog = ref(false)
const userForm = ref({
  employeeId: '',
  username: '',
  email: '',
  password: '',
  roles: [],
  menus: [],
})

// Confirmation Dialog States
const displayConfirmation = ref(false)
const displayEditConfirmation = ref(false)
const statUserInfo = ref(true)

const fetchUsers = async () => {
  try {
    loading.value = true
    const response = await UserService.getAllUsers({
      pageNumber:
        selectedPageNumber.value != 1
          ? selectedPageNumber.value
          : Math.floor(first.value / rowsPerPage.value) + 1,
      size: rowsPerPage.value,
      sortBy: 'desc',
    }).then((response) => response.data)

    if (response.status != '200') {
      alertError('Error', response.message || 'Failed to Fetch Users')
    } else {
      selectedUsers.value = [] // Reset selection
      users.value = response.data.content
      totalRecords.value = response.data.page.totalElements
      first.value = response.data.page.number * rowsPerPage.value
    }
  } catch (error) {
    loading.value = false
    alertError('Error', 'Failed to Fetch Users: ' + error.message)
  } finally {
    loading.value = false
  }
}
const getAllMenus = async () => {
  try {
    const response = await UserService.getAllMenus().then((response) => response.data)

    if (response.status != '200') {
      alertError('Error', response.message || 'Failed to Fetch Menus')
    } else {
      menus.value = response.data.map((menu) => ({
        name: menu.label,
        id: menu.id,
      }))
    }
  } catch (error) {
    alertError('Error', error.message || 'Failed to Fetch Menus')
  }
}
const getAllRoles = async () => {
  try {
    const response = await UserService.getAllRoles().then((response) => response.data)

    if (response.status != '200') {
      alertError('Error', response.message || 'Failed to Fetch Roles')
    } else {
      roles.value = response.data.content.map((role) => ({
        name: role.name,
        id: role.id,
      }))
    }
  } catch (error) {
    alertError('Error', 'Failed to Fetch Roles: ' + error.message)
  }
}
onMounted(async () => {
  const storedPage = localStorage.getItem('_UserManagementTbPageSeleted')
  selectedPageNumber.value = storedPage && !isNaN(parseInt(storedPage)) ? parseInt(storedPage) : 1
  first.value = (selectedPageNumber.value - 1) * rowsPerPage.value

  try {
    // Fetch roles
    await getAllRoles()
    // Wait for 1 second before proceeding
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Fetch menus
    await getAllMenus()

    // Wait for another 1 second
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Fetch users
    await fetchUsers()
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

const getStatusLabel = (isActive) => {
  return isActive ? 'primary' : 'danger'
}
const onPage = (event) => {
  first.value = event.first
  rowsPerPage.value = event.rows
  const pageNumber = Math.floor(event.first / event.rows) + 1
  localStorage.setItem('_UserManagementTbPageSeleted', pageNumber)
  selectedPageNumber.value = pageNumber
  fetchUsers(pageNumber, rowsPerPage.value)
}

function openUserDetailDialog(user) {
  selectedUsers.value = user
  userDetailDialog.value = true
}

// Create User
function openNewUserDialog() {
  userForm.value = {
    employeeId: '',
    username: '',
    email: '',
    password: '',
    roles: [],
    menus: [],
  }
  newUserDialog.value = true
}
async function createUser() {
  // check user info
  fnValidateUserInfo(userForm)

  if (statUserInfo.value) {
    try {
      loading.value = true
      const response = await UserService.createUser(userForm.value)
      if (response.data.status === '200') {
        alertSuccess('Success', 'User Created Successfully')
        // fetch the updated user list
        fetchUsers()
        newUserDialog.value = false
      } else {
        alertError('Error', response.data.message)
      }
    } catch (error) {
      alertError('Error', 'Failed to Create User: ' + error.message)
    } finally {
      loading.value = false
    }
  }
}

// Edit User
function editUser(user) {
  userForm.value.employeeId = user.employeeId
  userForm.value.username = user.username
  userForm.value.email = user.email
  userForm.value.isEnable = user.isEnable

  userForm.value.roles = roles.value.filter((role) =>
    user.roles.some((r) => r.id.toString() === role.id.toString()),
  )
  userForm.value.menus = menus.value.filter((menu) =>
    user.menus.some((m) => m.id.toString() === menu.id.toString()),
  )

  editUserDialog.value = true
}
async function updateUser() {
  // check user info
  fnValidateUserInfo(userForm)

  if (statUserInfo.value) {
    try {
      loading.value = true
      // Extract IDs before sending to API
      const updateData = {
        ...userForm.value,
        roles: userForm.value.roles.map((r) => r.id),
        menus: userForm.value.menus.map((m) => m.id),
      }
      const response = await UserService.updateUser(updateData)
      if (response.data.status === '200') {
        alertSuccess('Success', 'User Updated Successfully')
        fetchUsers()
        editUserDialog.value = false
      } else {
        alertError('Success', 'Failed to Update User: ' + response.data.message)
      }
    } catch (error) {
      alertError('Error', 'Failed to Update User: ' + error.message)
    } finally {
      loading.value = false
    }
  }
}

/**
 * Confirm Update User
 * Displays a confirmation dialog before saving the changes
 */
function confirmUpdateUser() {
  // call validate before confirm popup
  fnValidateUserInfo()
  if (statUserInfo.value) {
    displayEditConfirmation.value = true
  }
}

async function fnHandleConfirmUpdate() {
  await updateUser()
  displayEditConfirmation.value = false
}

function fnCloseConfirmUpdate() {
  displayEditConfirmation.value = false
}

/*
 * Confirm Delete User
 * Displays a confirmation dialog before deleting a user
 */
function confirmDeleteUser(user) {
  displayConfirmation.value = true
  userToDelete.value = user
}

/*
 * Delete User
 * Deletes a user and refreshes the user list
 */
async function deleteUser(user) {
  try {
    const employeeIds = {
      employeeIds: Array.isArray(user) ? user.map((u) => u.employeeId) : [user.employeeId],
    }

    loading.value = true
    const response = await UserService.deleteUser(employeeIds)
    if (response.data.status === '200') {
      alertSuccess('Success', 'User Deleted Successfully')

      // Refresh the user list after deletion
      fetchUsers()
    } else {
      alertError('Error', 'Failed to Delete User: ' + response.data.message)
    }
  } catch (error) {
    alertError('Error', 'Failed to Delete User: ' + error.message)
  } finally {
    loading.value = false
  }
}

function fnCloseConfirmDeleteUser() {
  displayConfirmation.value = false
  userToDelete.value = null
}
function fnConfirmDeleteUser() {
  displayConfirmation.value = false
  if (userToDelete.value) {
    deleteUser(userToDelete.value)
  }
  userToDelete.value = null // Reset the new ref
}

// handle dialog close to reset form
watch(editUserDialog, (newValue) => {
  if (!newValue) {
    userForm.value = {
      employeeId: '',
      username: '',
      email: '',
      roles: [],
      menus: [],
      isActive: true,
    }
  }
})

/*
 Handle export data table to cvs file
*/
function exportCSV() {
  dt.value.exportCSV()
}

/*
 * Handle Search
 */
const debouncedSearch = useDebounceFn(async () => {
  const param = {
    filterValue: searchString.value,
  }

  loading.value = true

  const response = await UserService.searchUser(param, {
    pageNumber:
      selectedPageNumber.value != 1
        ? selectedPageNumber.value
        : Math.floor(first.value / rowsPerPage.value) + 1,
    size: rowsPerPage.value,
    sortBy: 'desc',
  })
    .then((res) => res.data)
    .finally(() => {
      loading.value = false
    })
  selectedUsers.value = [] // Reset selection
  users.value = response.data.content
  totalRecords.value = response.data.page.totalElements
  first.value = response.data.page.number * rowsPerPage.value
}, 400)

const fnValidateUserInfo = () => {
  // Initialize validation status
  statUserInfo.value = true

  // Validate employeeId
  if (!userForm.value.employeeId.trim()) {
    alertError('Error', 'Employee ID cannot be empty!')
    statUserInfo.value = false
    return statUserInfo
  }

  // Validate username
  if (!userForm.value.username.trim()) {
    alertError('Error', 'Username cannot be empty!')
    statUserInfo.value = false
    return statUserInfo
  }

  // Validate Password
  if (newUserDialog.value) {
    if (!userForm.value.password.trim()) {
      alertError('Error', 'Password cannot be empty!')
      statUserInfo.value = false
      return statUserInfo
    }
  }

  // Validate email
  if (!userForm.value.email.trim()) {
    alertError('Error', 'Email cannot be empty!')
    statUserInfo.value = false
    return statUserInfo
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(userForm.value.email)) {
    alertError('Error', 'Please enter a valid email address!')
    statUserInfo.value = false
    return statUserInfo
  }

  // Validate roles
  if (!userForm.value.roles || userForm.value.roles.length === 0) {
    alertError('Error', 'At least one role must be selected!')
    statUserInfo.value = false
    return statUserInfo
  }

  // Validate menus
  if (!userForm.value.menus || userForm.value.menus.length === 0) {
    alertError('Error', 'At least one menu must be selected!')
    statUserInfo.value = false
    return statUserInfo
  }
  return statUserInfo
}
</script>

<template>
  <div>
    <div class="card">
      <Toolbar class="mb-6">
        <template #start>
          <Button
            label="New"
            icon="pi pi-plus"
            severity="primary"
            class="mr-2 btn-primary"
            @click="openNewUserDialog"
          />
          <Button
            label="Delete"
            icon="pi pi-trash"
            class="mr-2"
            severity="danger"
            :disabled="!selectedUsers || !selectedUsers.length"
            @click="
              selectedUsers && selectedUsers.length && selectedUsers.length < 2
                ? confirmDeleteUser(selectedUsers[0])
                : alertError('Error', 'Can not perform multiple user in same time!')
            "
          />
          <Button
            label="Edit"
            icon="pi pi-pencil"
            severity="success"
            :disabled="!selectedUsers || !selectedUsers.length"
            @click="
              selectedUsers && selectedUsers.length && selectedUsers.length < 2
                ? editUser(selectedUsers[0])
                : alertError('Error', 'Can not perform multiple user in same time!')
            "
          />
        </template>
        <template #end>
          <Button label="Export" icon="pi pi-upload" severity="info" @click="exportCSV($event)" />
        </template>
      </Toolbar>

      <DataTable
        ref="dt"
        v-model:selection="selectedUsers"
        :value="users"
        dataKey="employeeId"
        class="p-datatable-lg"
        :loading="loading"
      >
        <template #header>
          <div class="flex flex-wrap gap-2 items-center justify-between">
            <h4 class="m-0">Users Listing</h4>
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="searchString" @input="debouncedSearch" placeholder="Search..." />
            </IconField>
          </div>
        </template>
        <Column selectionMode="multiple" style="width: 0.1rem" :exportable="false"></Column>
        <Column field="employeeId" header="UserID" sortable style="min-width: 8rem"></Column>
        <Column field="username" header="Username" sortable style="min-width: 10rem"></Column>
        <Column
          headerStyle="text-align: center; item-align: center"
          field="email"
          header="Email"
          style="min-width: 16rem"
        ></Column>
        <Column field="isActive" header="Status" sortable style="min-width: 5rem">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.isActive ? 'ACTIVE' : 'INACTIVE'"
              :severity="getStatusLabel(slotProps.data.isActive)"
            />
          </template>
        </Column>
        <Column :exportable="false" style="min-width: 12rem">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              outlined
              rounded
              class="mr-2"
              @click="editUser(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              outlined
              rounded
              severity="danger"
              class="mr-2"
              @click="confirmDeleteUser(slotProps.data)"
            />
            <Button
              icon="pi pi-info"
              outlined
              rounded
              severity="primary"
              @click="openUserDetailDialog(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
      <Paginator
        v-model:rows="rowsPerPage"
        v-model:first="first"
        :totalRecords="totalRecords"
        :rowsPerPageOptions="[5, 10, 20, 30]"
        @page="onPage($event)"
      />
    </div>

    <Dialog
      v-model:visible="newUserDialog"
      :style="{ width: '450px' }"
      header="Create User"
      :modal="true"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label class="block font-bold mb-3">User ID</label>
          <InputText required="true" autofocus v-model="userForm.employeeId" fluid />
        </div>
        <div>
          <label class="block font-bold mb-3">Username</label>
          <InputText required="true" v-model="userForm.username" fluid />
        </div>
        <div>
          <label class="block font-bold mb-3">Email</label>
          <InputText required="true" v-model="userForm.email" fluid />
        </div>
        <div>
          <label class="block font-bold mb-3">Password</label>
          <Password
            id="password"
            v-model="userForm.password"
            :toggleMask="true"
            class="w-full"
            fluid
            :feedback="false"
            aria-required="true"
            aria-describedby="password-error"
            autocomplete="current-password"
          ></Password>
        </div>
        <div>
          <label class="block font-bold mb-3">Roles</label>
          <MultiSelect
            v-model="userForm.roles"
            :options="roles"
            optionLabel="name"
            dataKey="id"
            placeholder="Select Roles"
            class="w-full"
            display="chip"
            :filter="true"
          >
          </MultiSelect>
        </div>
        <div>
          <label class="block font-bold mb-4">Menus</label>
          <MultiSelect
            v-model="userForm.menus"
            :options="menus"
            optionLabel="name"
            dataKey="id"
            placeholder="Select Menus"
            class="w-full"
            display="chip"
            :filter="true"
          >
          </MultiSelect>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <Button label="Cancel" severity="secondary" @click="newUserDialog = false" />
          <Button label="Create user" @click="createUser" />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="editUserDialog"
      :style="{ width: '450px' }"
      header="Edit User"
      :modal="true"
    >
      <div class="flex flex-col gap-6">
        <div>
          <label class="block font-bold mb-3">User ID</label>
          <InputText disabled v-model="userForm.employeeId" fluid />
        </div>
        <div>
          <label class="block font-bold mb-3">Username</label>
          <InputText v-model="userForm.username" fluid />
        </div>
        <div>
          <label class="block font-bold mb-3">Email</label>
          <InputText v-model="userForm.email" fluid />
        </div>
        <div>
          <label class="block font-bold mb-3">Roles</label>
          <MultiSelect
            v-model="userForm.roles"
            :options="roles"
            optionLabel="name"
            dataKey="id"
            placeholder="Select Roles"
            class="w-full"
            display="chip"
            :filter="true"
          >
          </MultiSelect>
        </div>
        <div>
          <label class="block font-bold mb-4">Menus</label>
          <MultiSelect
            v-model="userForm.menus"
            :options="menus"
            optionLabel="name"
            dataKey="id"
            placeholder="Select Menus"
            class="w-full"
            display="chip"
            :filter="true"
          >
          </MultiSelect>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="editUserDialog = false" />
        <Button label="Update user" @click="confirmUpdateUser" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="userDetailDialog"
      :style="{ width: '80vw', maxWidth: '450px' }"
      header="User Details"
      :modal="true"
      class="p-dialog-custom"
      @hide="userDetailDialog = false"
    >
      <div v-if="selectedUsers" class="flex flex-col gap-4 p-2 overflow-auto">
        <div>
          <label for="userId" class="block text-base text-900 font-semibold mb-2">User ID</label>
          <InputText id="userId" :value="selectedUsers.employeeId" disabled class="w-full" />
        </div>
        <div>
          <label for="username" class="block text-base text-900 font-semibold mb-2">Username</label>
          <InputText id="username" :value="selectedUsers.username" disabled class="w-full" />
        </div>
        <div>
          <label for="email" class="block text-base text-900 font-semibold mb-2">Email</label>
          <InputText id="email" :value="selectedUsers.email" disabled class="w-full" />
        </div>
        <div>
          <label class="block text-base text-900 font-semibold mb-2" aria-label="User Roles">
            Roles
          </label>
          <Toolbar>
            <template #start>
              <div class="p-3" v-if="selectedUsers.roles && selectedUsers.roles.length">
                <div class="flex flex-wrap gap-2">
                  <Tag
                    v-for="role in selectedUsers.roles"
                    :key="role.id"
                    :value="role.name"
                    severity="primary"
                  />
                </div>
              </div>
              <div v-else class="text-600">N/A</div>
            </template>
          </Toolbar>
        </div>

        <div>
          <label class="block font-bold mb-4">Menus</label>
          <Toolbar>
            <template #start>
              <div
                class="p-3"
                v-if="
                  selectedUsers.menus && selectedUsers.menus.some((menu) => menu.mainId != null)
                "
              >
                <div class="flex flex-wrap gap-2">
                  <Tag
                    v-for="menu in selectedUsers.menus.filter((menu) => menu.mainId != null)"
                    :key="menu.id"
                    :value="menu.label"
                    severity="primary"
                  />
                </div>
              </div>
              <div v-else class="text-600">N/A</div>
            </template>
          </Toolbar>
        </div>
        <div>
          <label class="block text-base text-900 font-semibold mb-2">Account Info</label>
          <Toolbar>
            <template #start>
              <ul class="list-none p-0 m-0">
                <li class="flex justify-content-between align-items-center mb-2">
                  <label class="text-700">Account Non Expired:</label>
                  <Tag
                    :value="selectedUsers.isAccountNonExpired ? 'Yes' : 'No'"
                    :severity="selectedUsers.isAccountNonExpired ? 'success' : 'danger'"
                    class="custom-tag"
                  />
                </li>
                <li class="flex justify-content-between align-items-center mb-2">
                  <label class="text-700">Account Non Locked:</label>
                  <Tag
                    :value="selectedUsers.isAccountNonLocked ? 'Yes' : 'No'"
                    :severity="selectedUsers.isAccountNonLocked ? 'success' : 'danger'"
                    class="custom-tag"
                  />
                </li>
                <li class="flex justify-content-between align-items-center mb-2">
                  <label class="text-700">Credentials Non Expired:</label>
                  <Tag
                    :value="selectedUsers.isCredentialNonExpired ? 'Yes' : 'No'"
                    :severity="selectedUsers.isCredentialNonExpired ? 'success' : 'danger'"
                    class="custom-tag"
                  />
                </li>
                <li class="flex justify-content-between align-items-center mb-2">
                  <label class="text-700">Enabled:</label>
                  <Tag
                    :value="selectedUsers.isEnable ? 'Yes' : 'No'"
                    :severity="selectedUsers.isEnable ? 'success' : 'danger'"
                    class="custom-tag"
                  />
                </li>
                <li class="flex justify-content-between align-items-center">
                  <label class="text-700">Status:</label>
                  <Tag
                    :value="selectedUsers.isActive ? 'Active' : 'Inactive'"
                    :severity="getStatusLabel(selectedUsers.isActive)"
                    class="custom-tag"
                  />
                </li>
              </ul>
            </template>
          </Toolbar>
        </div>
      </div>
      <template #footer>
        <Button
          label="Close"
          icon="pi pi-times"
          class="p-button-text"
          @click="userDetailDialog = false"
        />
      </template>
    </Dialog>
  </div>
  <Dialog
    header="Confirmation"
    v-model:visible="displayConfirmation"
    :style="{ width: '400px' }"
    :modal="true"
  >
    <div class="flex items-center justify-center">
      <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
      <span v-if="userToDelete"
        >Are you sure you want to delete user {{ userToDelete.username }}?</span
      >
    </div>
    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        @click="fnCloseConfirmDeleteUser"
        text
        severity="secondary"
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        @click="fnConfirmDeleteUser"
        severity="danger"
        outlined
        autofocus
      />
    </template>
  </Dialog>

  <Dialog
    header="Confirmation"
    v-model:visible="displayEditConfirmation"
    :style="{ width: '400px' }"
    :modal="true"
  >
    <div class="flex items-center justify-center">
      <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
      <span>Are you sure you want to update info user {{ userForm.username }}?</span>
    </div>
    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        @click="fnCloseConfirmUpdate"
        text
        severity="secondary"
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        @click="fnHandleConfirmUpdate"
        severity="primary"
        outlined
        autofocus
      />
    </template>
  </Dialog>
</template>
<style>
.custom-center {
  text-align: center !important;
}

.p-dialog-custom :deep(.p-dialog-content) {
  padding: 1rem;
  border-radius: 0.5rem;
}
.custom-tag {
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
}

.p-tag.p-tag-success {
  background-color: #4caf50; /* Your brand success color */
  color: #ffffff;
}
.p-tag.p-tag-info {
  background-color: #2196f3; /* Your brand info color */
  color: #ffffff;
}
.p-tag.p-tag-danger {
  background-color: #f44336; /* Your brand danger color */
  color: #ffffff;
}
</style>
