<template>
  <div class="dashboard">
    <page-header title="Dashboard" />
    
    <!-- Stats Overview -->
    <div class="row mb-4" v-if="stats">
      <div class="col-md-3 col-sm-6 mb-3" v-for="(stat, index) in statCards" :key="index">
        <app-card :card-class="`text-white h-100`" :style="`background-color: ${stat.color}; color: #fff!important;`">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="card-title h2">{{ stats[stat.key] }}</h5>
              <h6 class="card-subtitle">{{ stat.label }}</h6>
            </div>
            <div>
              <i :class="`bi ${stat.icon} fs-1`"></i>
            </div>
          </div>
        </app-card>
      </div>
    </div>
    
    <div class="row">
      <!-- Bot Info Card -->
      <div class="col-lg-6 mb-4">
        <app-card title="Bot Information">
          <loading-state v-if="loading" message="Loading bot information..." />
          <error-alert v-else-if="error" :message="error" />
          <div v-else-if="botInfo" class="table-responsive">
            <div class="bot-info">
              <div class="d-flex align-items-center mb-4">
              <img v-if="botInfo.avatar" :src="botInfo.avatar" alt="Bot Avatar" class="rounded-circle me-3" width="64" height="64">
              <div>
                <h4 class="mb-1">{{ botInfo.username }}</h4>
                <span class="badge bg-success" v-if="botInfo.status === 'online'">Online</span>
                <span class="badge bg-secondary" v-else>{{ botInfo.status }}</span>
              </div>
              </div>
              
              <div class="table-responsive">
              <ul class="list-unstyled">
                <li class="mb-2">
                  <strong>ID:</strong> <text-copy :text="botInfo.id" /> 
                </li>
                <li class="mb-2">
                  <strong>Servers:</strong> <span>{{ botInfo.guilds }}</span>
                </li>
                <li class="mb-2">
                  <strong>Users:</strong> <span>{{ botInfo.users }}</span>
                </li>
                <li class="mb-2">
                  <strong>Created:</strong> <span>{{ new Date(botInfo.createdAt).toLocaleString() }}</span>
                </li>
                <li v-if="botInfo.activity" class="mb-2">
                  <strong>Activity:</strong> <span>{{ botInfo.activity }}</span>
                </li>
              </ul>
              </div>
            </div>
          </div>
        </app-card>
      </div>
      
      <!-- Uptime Card -->
      <div class="col-lg-6 mb-4">
        <app-card title="Uptime">
          <uptime-display v-if="stats" :startTime="stats.startedTimestamp" />
          <loading-state v-else message="Loading uptime data..." />
        </app-card>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <app-card title="Quick Actions">
      <div class="row g-3">
        <div class="col-md-3 col-sm-6" v-for="(action, index) in quickActions" :key="index">
          <router-link :to="action.path" class="btn d-block">
            <i :class="`bi ${action.icon} me-2`"></i> {{ action.label }}
          </router-link>
        </div>
      </div>
    </app-card>
  </div>
</template>

<script>
import PageHeader from '../components/layout/PageHeader.vue';
import AppCard from '../components/ui/AppCard.vue';
import LoadingState from '../components/ui/LoadingState.vue';
import ErrorAlert from '../components/ui/ErrorAlert.vue';
import UptimeDisplay from '../components/UptimeDisplay.vue';
import TextCopy from '../components/ui/TextCopy.vue';
export default {
  name: 'HomeView',
  components: {
    PageHeader,
    AppCard, 
    LoadingState,
    ErrorAlert,
    UptimeDisplay,
    TextCopy,
  },
  data() {
    return {
      loading: true,
      error: null,
      botInfo: null,
      stats: null,
      statCards: [
        { key: 'guilds', label: 'Servers', icon: 'bi-database', color: '#0eaae3' },
        { key: 'users', label: 'Users', icon: 'bi-people', color:'#f57a22' },
        { key: 'commands', label: 'Commands', icon: 'bi-terminal', color: '#d41c2e' },
        { key: 'packagesStatus', label: 'Packages', icon: 'bi-box', color: '#13ad2a' },
      ],
      quickActions: [
        { label: 'Manage Servers', path: '/guilds', color: '#0eaae3', icon: 'bi-database' },
        { label: 'View Commands', path: '/commands', color: '#0eaae3', icon: 'bi-terminal' },
        { label: 'Manage Packages', path: '/packages', color: '#0eaae3', icon: 'bi-box' },
        { label: 'View Statistics', path: '/stats', color: '#0eaae3', icon: 'bi-graph-up' }
      ]
    };
  },
  computed: {
    botInfoDisplay() {
      if (!this.botInfo) return {};
      return {
        'Username': this.botInfo.username,
        'ID': this.botInfo.id,
        'Servers': this.botInfo.guilds,
        'Users': this.botInfo.users
      };
    }
  },
  async created() {
    try {
      // Load bot information
      const response = await fetch('/api/bot/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.botInfo = await response.json();
      
      // Load stats
      const statsResponse = await fetch('/api/stats');
      if (statsResponse.ok) {
        this.stats = await statsResponse.json();
      }
      
      this.loading = false;
    } catch (error) {
      this.error = `Error loading data: ${error.message}`;
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.activity-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.btn {
  transition: all 0.3s;

}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card {
  transition: all 0.3s;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dashboard h1 {
  color: var(--light);
  font-weight: 600;
  margin-bottom: 1.5rem;
}
</style>