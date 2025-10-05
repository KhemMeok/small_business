import { useToast } from 'primevue/usetoast'

export function useToastNotification() {
  // Renamed to follow composable naming convention
  const toast = useToast() // useToast() is called inside a composable.

  const alertInfo = (title, message) => {
    toast.add({ severity: 'success', summary: title, detail: message, life: 3000 })
  }

  const alertError = (title, message) => {
    toast.add({ severity: 'error', summary: title, detail: message, life: 3000 })
  }

  const alertSuccess = (title, message) => {
    toast.add({ severity: 'success', summary: title, detail: message, life: 3000 })
  }

  const alertWarning = (title, message) => {
    toast.add({ severity: 'warn', summary: title, detail: message, life: 3000 })
  }

  // You can return multiple functions if needed
  return { alertInfo, alertError, alertSuccess, alertWarning }
}
