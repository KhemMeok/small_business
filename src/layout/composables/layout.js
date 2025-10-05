import { computed, reactive, watchEffect } from 'vue';


const userPreset = localStorage.getItem('app-preset') || 'Aura';
const userPrimary = localStorage.getItem('app-primary') || 'htbSignature';
const userSurface = localStorage.getItem('app-surfaces') || 'soho';
//const userDarkTheme = localStorage.getItem('app-darkTheme') || true;
const userDarkTheme = localStorage.getItem('primevue-theme-dark') || true;
const userMenuMode = localStorage.getItem('app-menuMode') || 'static';

const layoutConfig = reactive({
  preset: userPreset,
  primary: userPrimary,
  surface: userSurface,
  darkTheme: userDarkTheme, // true for dark mode, false for light mode
  menuMode: userMenuMode
});

const layoutState = reactive({
  staticMenuDesktopInactive: false,
  overlayMenuActive: false,
  profileSidebarVisible: false,
  configSidebarVisible: false,
  staticMenuMobileActive: false,
  menuHoverActive: false,
  activeMenuItem: null
});

const isSpinnerLoading = reactive({ isLoading: false });

// LocalStorage key for theme color
const THEME_LOCAL_STORAGE_KEY = 'primevue-theme-dark';


const isNightTime = () => {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
};

export function useLayout() {

  const storedThemePreference = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);

  if (storedThemePreference !== null) {
    layoutConfig.darkTheme = storedThemePreference === 'true';
  } else {
    layoutConfig.darkTheme = isNightTime();
  }

  watchEffect(() => {
    if (layoutConfig.darkTheme) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }

    // Save the *current* theme state to localStorage.
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, layoutConfig.darkTheme.toString());
  });

  const setActiveMenuItem = (item) => {
    layoutState.activeMenuItem = item.value || item;
  };

  const toggleDarkMode = () => {
    if (!document.startViewTransition) {
      executeDarkModeToggle();

      return;
    }

    document.startViewTransition(() => executeDarkModeToggle(event));
  };

  const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    document.documentElement.classList.toggle('app-dark');
  };

  const toggleMenu = () => {
    if (layoutConfig.menuMode === 'overlay') {
      layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
    }

    if (window.innerWidth > 991) {
      layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
    } else {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
    }
  };

  const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);

  const isDarkTheme = computed(() => layoutConfig.darkTheme);

  const getPrimary = computed(() => layoutConfig.primary);

  const getSurface = computed(() => layoutConfig.surface);

  return {
    layoutConfig,
    layoutState,
    toggleMenu,
    isSidebarActive,
    isDarkTheme,
    getPrimary,
    getSurface,
    setActiveMenuItem,
    toggleDarkMode,
    isSpinnerLoading
  };
}
