import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/service/AuthService'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '/',
          name: 'dashboard',
          component: () => import('@/pages/DashboardView.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: '/dba/FixParamManager',
          name: 'FixParamManager',
          component: () => import('@/pages/FixParamManager.vue')
        },
        {
          path: '/user/userManagement',
          name: 'User Management',
          component: () => import('@/pages/UserManagement.vue')
        },
        {
          path: '/user/profile',
          name: 'User Profile',
          component: () => import('@/pages/UserProfile.vue')
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginView.vue')
    },
  ]
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !authStore.isAuthenticated) {
    // If route requires auth and user is not authenticated,
    // redirect to the login page.
    next('/login')
  } else {
    // Otherwise, allow navigation.
    next()
  }
})

export default router;
