import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import GuildListView from './views/GuildListView.vue';
import GuildDetailView from './views/GuildDetailView.vue';
import CommandListView from './views/CommandListView.vue';
import PackageListView from './views/PackageListView.vue';
import PackageDetailView from './views/PackageDetailView.vue';
import LoginView from './views/LoginView.vue';
import ErrorView from './views/ErrorView.vue';
import StatsVisualizationView from './views/StatsVisualizationView.vue';
import CommandDetailView from './views/CommandDetailView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/guilds',
    name: 'guilds',
    component: GuildListView
  },
  {
    path: '/guilds/:id',
    name: 'guild-detail',
    component: GuildDetailView
  },
  {
    path: '/commands',
    name: 'commands',
    component: CommandListView
  },
  {
    path: '/commands/:package/:name',
    name: 'commands-package-detail',
    component: CommandDetailView
  },
  {
    path: '/packages',
    name: 'packages',
    component: PackageListView
  },
  {
    path: '/packages/:name',
    name: 'package-detail',
    component: PackageDetailView
  },
  {
    path: '/error',
    name: 'error',
    component: ErrorView,
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: ErrorView,
    props: {
      title: 'Page Not Found',
      message: 'The page you are looking for does not exist.'
    }
  },
  {
    path: '/stats',
    name: 'StatsVisualization',
    component: StatsVisualizationView
  }
];

// Create router instance
const router = createRouter({
  history: createWebHistory('/app/'),
  routes
});

// Add navigation guard for authentication
router.beforeEach((to, from, next) => {
  // Skip auth check for login and error pages
  if (to.path === '/login' || to.path === '/error' || to.path.startsWith('/:pathMatch')) {
    return next();
  } 
  
  // Check if we're in localhost environment (bypass auth)
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  if (isLocalhost) {
    return next();
  }
  
  // Check authentication status for non-localhost
  fetch('/api/auth/status')
    .then(response => response.json())
    .then(data => {
      if (data.authenticated) {
        next();
      } else {
        next('/login');
      }
    })
    .catch(error => {
      console.error('Auth check failed:', error);
      next('/error');
    });
});

export default router;