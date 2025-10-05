<script setup>
// Step 1: Import the specific spinner component you want
import PulseLoader from 'vue-spinner/src/SyncLoader.vue'
import { onMounted, ref } from 'vue'

// (Optional) You can also define props to control the spinner dynamically

const loading = ref(true)
const color = ref(getComputedStyle(document.documentElement).getPropertyValue('--primary-color'))
const size = ref('20px')

onMounted(() => {
  setColor()
})

function setColor() {
  const documentStyle = getComputedStyle(document.documentElement)
  const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary')

  if (textColorSecondary) {
    color.value = textColorSecondary
  } else {
    console.warn('--text-color CSS variable not found or empty. Using default.')
    // Optionally, keep a fallback color
    color.value = '#42b883'
  }
}
</script>

<template>
  <div class="spinner-container">
    <PulseLoader :loading="loading" :color="color" :size="size"></PulseLoader>

    <!-- <p>processing...</p> -->
  </div>
</template>

<style scoped>
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 20px;
}
</style>
