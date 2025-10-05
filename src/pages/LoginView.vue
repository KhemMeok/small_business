<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue'
import { ref } from 'vue'
import { useAuthStore } from '@/service/AuthService'
import { useRouter } from 'vue-router'

import userService from '@/service/UserService'

import { useToastNotification } from '@/layout/composables/useToastNotification'

const { alertInfo, alertError } = useToastNotification()

const error = ref(null)
const loading = ref(false)
const staffId = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()

const userTypes = ref([
  { name: 'AD User', code: 'LDAP' },
  { name: 'System User', code: 'SYSTEM' },
])
const encryptedPassword = ref('')

const userType = ref(userTypes.value[1])

async function handleLogin() {
  error.value = null
  loading.value = true

  if (!staffId.value || !password.value) {
    alertError('Input Required', 'Staff ID and Password are required.')
    loading.value = false
    return
  }

  await userService.encryptText(password.value).then((p) => {
    encryptedPassword.value = p.data
  })

  try {
    const response = await authStore.login({
      employeeId: staffId.value,
      password: encryptedPassword.value,
      type: userType.value.code,
      isEncrypt: true,
    })
    if (response.status == '200') {
      localStorage.setItem('employeeId', staffId.value)
      authStore.setToken(response.token)

      alertInfo('Successful login', response.message)

      // Route to dashboard page
      router.push('/')

      try {
        setTimeout(async () => {
          // Call API get user info
          userService.getUserInfo({ employeeId: staffId.value.toString() }).then((res) => {
            localStorage.setItem('userInfo', JSON.stringify(res.data.data))
            authStore.setUserInfoStat()
          })
        }, 100)
      } catch (err) {
        alertError('Login Failed', err.value)
      }
    } else {
      alertError('Login Failed', response.message)
    }
  } catch (err) {
    alertError('Login Failed', err.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <FloatingConfigurator />
  <div
    class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden"
  >
    <div class="flex flex-col items-center justify-center p-4 sm:p-0">
      <div
        class="w-full max-w-md bg-surface-0 dark:bg-surface-900 py-12 px-8 sm:px-12 rounded-3xl shadow-lg"
        style="border-radius: 53px"
        aria-live="polite"
        aria-atomic="true"
        role="form"
      >
        <div class="text-center mb-8">
          <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-bold mb-4">
            Welcome to Database Monitoring Systems!
          </h1>
          <p class="text-muted-color font-medium">Sign in to continue</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="mb-6">
            <label
              for="staffId"
              class="block text-surface-900 dark:text-surface-0 text-lg font-medium mb-2"
              >Staff ID</label
            >
            <InputText
              id="staffId"
              type="text"
              placeholder="Enter your Staff ID"
              class="w-full"
              v-model="staffId"
              aria-required="true"
              :aria-invalid="!!error && staffId === ''"
              aria-describedby="staffId-error"
              required="true"
              autofocus="true"
            />
          </div>

          <div class="mb-6">
            <label
              for="password"
              class="block text-surface-900 dark:text-surface-0 font-medium text-lg mb-2"
              >Password</label
            >
            <Password
              id="password"
              v-model="password"
              placeholder="Enter your password"
              :toggleMask="true"
              class="w-full"
              fluid
              :feedback="false"
              aria-required="true"
              :aria-invalid="!!error && password === ''"
              aria-describedby="password-error"
              autocomplete="current-password"
            ></Password>
          </div>
          <div class="mb-6">
            <label
              for="userType"
              class="block text-surface-900 dark:text-surface-0 text-lg font-medium mb-2"
              >User Type</label
            >
            <Select
              id="userType"
              v-model="userType"
              :options="userTypes"
              optionLabel="name"
              placeholder="Select a User Type"
              class="w-full"
              aria-required="true"
            />
          </div>
          <Button
            type="submit"
            label="Sign In"
            class="w-full text-lg py-3"
            :loading="loading"
            :disabled="loading"
          >
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pi-eye {
  transform: scale(1.6);
  margin-right: 1rem;
}

.pi-eye-slash {
  transform: scale(1.6);
  margin-right: 1rem;
}
</style>
