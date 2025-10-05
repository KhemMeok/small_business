<script setup>
import { onMounted, ref, watch } from 'vue'

import AppMenuItem from './AppMenuItem.vue'
import { useAuthStore } from '@/service/AuthService'

const auth = useAuthStore()
var model = ref(null)
var userInfo = ref(null)

async function getUserInfo() {
  await auth.getUserInfoFromLocalStorage().then((d) => (userInfo.value = d))
  if (userInfo.value != null) {
    model.value = userInfo.value.menus
  }
}

watch(
  () => auth.userInfoStatus,
  async () => {
    await getUserInfo()
  },
)

onMounted(async () => {
  await getUserInfo()
})
</script>

<template>
  <ul class="layout-menu">
    <template v-for="(item, i) in model" :key="item">
      <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
      <li v-if="item.separator" class="menu-separator"></li>
    </template>
  </ul>
</template>

<style lang="scss" scoped></style>
