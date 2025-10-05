<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button' // Assuming you're importing these globally or via a plugin
import Dialog from 'primevue/dialog' // Ensure these are properly imported or registered

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  header: {
    type: String,
    default: 'Confirmation',
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?',
  },
  yesLabel: {
    type: String,
    default: 'Yes',
  },
  noLabel: {
    type: String,
    default: 'No',
  },
  // You can add more props for icon, button severity, etc.
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

// Internal ref to manage visibility, synced with prop
const internalVisible = ref(props.visible)

// Watch for changes in the 'visible' prop to update internal state
watch(
  () => props.visible,
  (newVal) => {
    internalVisible.value = newVal
  },
)

// Watch for changes in internal state to emit update to parent
watch(internalVisible, (newVal) => {
  emit('update:visible', newVal)
})

function onConfirm() {
  emit('confirm')
  internalVisible.value = false // Close dialog on confirmation
}

function onCancel() {
  emit('cancel')
  internalVisible.value = false // Close dialog on cancellation
}
</script>

<template>
  <Dialog
    :header="props.header"
    v-model:visible="internalVisible"
    :style="{ width: '350px' }"
    :modal="true"
  >
    <div class="flex items-center justify-center">
      <i class="pi pi-exclamation-triangle mr-4" style="font-size: 2rem" />
      <span>{{ props.message }}</span>
    </div>
    <template #footer>
      <Button
        :label="props.noLabel"
        icon="pi pi-times"
        @click="onCancel"
        text
        severity="secondary"
      />
      <Button
        :label="props.yesLabel"
        icon="pi pi-check"
        @click="onConfirm"
        severity="danger"
        outlined
        autofocus
      />
    </template>
  </Dialog>
</template>
