<script setup>
import { useLayout } from '@/layout/composables/layout'
import { computed, ref, watch } from 'vue'
import AppFooter from './AppFooter.vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

import LoadingSpinner from '@/components/LoadingSpinner.vue'

const { layoutConfig, layoutState, isSidebarActive, isSpinnerLoading } = useLayout()

const outsideClickListener = ref(null)

// const isLoading = ref(false)

watch(isSidebarActive, (newVal) => {
  if (newVal) {
    bindOutsideClickListener()
  } else {
    unbindOutsideClickListener()
  }
})

const containerClass = computed(() => {
  return {
    'layout-overlay': layoutConfig.menuMode === 'overlay',
    'layout-static': layoutConfig.menuMode === 'static',
    'layout-static-inactive':
      layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
    'layout-overlay-active': layoutState.overlayMenuActive,
    'layout-mobile-active': layoutState.staticMenuMobileActive,
  }
})

function bindOutsideClickListener() {
  if (!outsideClickListener.value) {
    outsideClickListener.value = (event) => {
      if (isOutsideClicked(event)) {
        layoutState.overlayMenuActive = false
        layoutState.staticMenuMobileActive = false
        layoutState.menuHoverActive = false
      }
    }
    document.addEventListener('click', outsideClickListener.value)
  }
}

function unbindOutsideClickListener() {
  if (outsideClickListener.value) {
    document.removeEventListener('click', outsideClickListener)
    outsideClickListener.value = null
  }
}

function isOutsideClicked(event) {
  const sidebarEl = document.querySelector('.layout-sidebar')
  const topbarEl = document.querySelector('.layout-menu-button')

  return !(
    sidebarEl.isSameNode(event.target) ||
    sidebarEl.contains(event.target) ||
    topbarEl.isSameNode(event.target) ||
    topbarEl.contains(event.target)
  )
}
</script>

<template>
  <div class="layout-wrapper" :class="containerClass">
    <app-topbar></app-topbar>
    <app-sidebar></app-sidebar>
    <div class="layout-main-container">
      <div class="layout-main">
        <router-view></router-view>
      </div>
      <app-footer></app-footer>
    </div>
    <div></div>
    <div class="layout-mask animate-fadein"></div>
  </div>
  <div v-if="isSpinnerLoading.isLoading" class="popup-overlay">
    <div class="popup-content">
      <LoadingSpinner color="#ffffff" size="20px"></LoadingSpinner>
    </div>
  </div>
  <Toast />
</template>

<style>
.popup-overlay {
  position: fixed; /* Position relative to the viewport */
  top: 0;
  left: 0;
  width: 100vw; /* 100% of the viewport width */
  height: 100vh; /* 100% of the viewport height */
  background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent black background */

  /* Use flexbox to center the content */
  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 9999; /* Ensure it's on top of all other content */
}
.popup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: white;
  font-size: 1.2rem;
}
</style>
