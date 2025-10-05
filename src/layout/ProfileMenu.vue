<script setup>
import ProfileImg from '@/assets/profile.png'
import { useAuthStore } from '@/service/AuthService'
import { useRouter } from 'vue-router'
import { onMounted, ref, watch } from 'vue'

const router = useRouter()

const authStore = useAuthStore()
const userName = ref('')

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

// first login
watch(
  () => authStore.userInfoStatus,
  async () => {
    authStore.getUserInfoFromLocalStorage().then((userInfo) => {
      userName.value = userInfo.username
    })
  },
)

// on page refresh
onMounted(async () => {
  authStore.getUserInfoFromLocalStorage().then((userInfo) => {
    if (userInfo) {
      userName.value = userInfo.username
    }
  })
})
</script>

<template>
  <div
    class="config-panel hidden absolute top-[3.25rem] right-0 w-60 p-4 bg-surface-0 dark:bg-surface-900 border border-surface rounded-border origin-top shadow-[0px_3px_5px_rgba(0,0,0,0.02),0px_0px_2px_rgba(0,0,0,0.05),0px_1px_4px_rgba(0,0,0,0.08)]"
  >
    <div class="flex flex-col gap-2 items-center justify-center">
      <div class="flex flex-col gap-2 items-center justify-center">
        <Avatar :image="ProfileImg" size="large" shape="circle"> </Avatar>

        <p style="margin-bottom: 0" class="text font-semibold">{{ userName }}</p>

        <span class="border-b border-surface w-full"></span>

        <div class="flex flex-col gap-2 w-full">
          <Button label="Profile" icon="pi pi-user" severity="secondary" outlined />
          <Button label="Settings" icon="pi pi-cog" severity="secondary" outlined />
          <span class="border-b border-surface w-full"></span>
          <Button
            label="Logout"
            icon="pi pi-fw pi-sign-in"
            severity="danger"
            class="w-full"
            text
            @click="handleLogout"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
