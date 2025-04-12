import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import GuildListView from './views/GuildListView.vue';
import GuildDetailView from './views/GuildDetailView.vue';
import CommandListView from './views/CommandListView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
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
  }
];

const router = createRouter({
  history: createWebHistory('/app/'),
  routes
});

export default router;