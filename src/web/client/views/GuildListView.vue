<template>
  <div class="guilds-page">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Servers</h2>
      <div class="search-box">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search servers..." 
            v-model="searchQuery"
          >
          <span class="input-group-text">
            <i class="bi bi-search"></i>
          </span>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading servers...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- Empty state -->
    <div v-else-if="guilds.length === 0" class="text-center p-5">
      <i class="bi bi-server fs-1 text-muted"></i>
      <p class="mt-2">No servers found</p>
    </div>
    
    <!-- Guilds display -->
    <div v-else class="row">
      <div class="col-xl-4 col-md-6 mb-4" v-for="guild in filteredGuilds" :key="guild.id">
        <div class="card h-100">
          <div class="card-header bg-transparent d-flex align-items-center">
            <div v-if="guild.icon" class="me-3">
              <img :src="guild.icon" alt="Server icon" class="rounded-circle" width="48" height="48">
            </div>
            <div v-else class="me-3">
              <div class="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center bg-primary text-white" style="width: 48px; height: 48px;">
                {{ guild.name.charAt(0) }}
              </div>
            </div>
            <h5 class="mb-0 text-truncate">{{ guild.name }}</h5>
          </div>
          
          <div class="card-body pb-0">
            <!-- Stats section -->
            <div class="row g-0 mb-3">
              <div class="col-6 border-end">
                <div class="text-center p-2">
                  <h6 class="mb-0">{{ guild.stats?.memberCount || guild.stats?.members?.total }}</h6>
                  <small class="text-muted">Members</small>
                </div>
              </div>
              <div class="col-6">
                <div class="text-center p-2">
                  <h6 class="mb-0">{{ guild.stats?.onlineMembers || "Hidden" }}</h6>
                  <small class="text-muted">Online</small>
                </div>
              </div>
            </div>
            
            <!-- Server details -->
            <div class="server-details mb-3">
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">ID:</span>
                <span class="text-truncate ms-2"><text-copy :text="guild.id" /></span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Prefix:</span>
                <span class="ms-2">{{ guild.prefix || '!' }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2" v-if="guild.stats">
                <span class="text-muted">Channels:</span>
                <span class="ms-2">{{ guild.stats.channels.total || 'N/A' }}</span>
              </div>
              <div class="d-flex justify-content-between" v-if="guild.stats">
                <span class="text-muted">Roles:</span>
                <span class="ms-2">{{ guild.stats.roles.total || 'N/A' }}</span>
              </div>
            </div>
          </div>
          
          <div class="card-footer bg-transparent">
            <router-link :to="`/guilds/${guild.id}`" class="btn btn-primary w-100">
              <i class="bi bi-gear me-2"></i> Manage
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TextCopy from '../components/ui/TextCopy.vue';
export default {
  name: 'GuildListView',
  components: {
    TextCopy
  },
  data() {
    return {
      loading: true,
      error: null,
      guilds: [],
      searchQuery: ''
    };
  },
  computed: {
    filteredGuilds() {
      if (!this.searchQuery) return this.guilds;
      
      const query = this.searchQuery.toLowerCase();
      return this.guilds.filter(guild => 
        guild.name.toLowerCase().includes(query) || 
        guild.id.includes(query)
      );
    }
  },
  async created() {
    try {
      this.guilds = await this.$api.guilds.getAllGuilds();
    } catch (error) {
      this.error = `Error loading servers: ${error.message}`;
      console.error('Error fetching guilds:', error);
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.avatar-placeholder {
  font-weight: bold;
  font-size: 1.5rem;
}

.server-details {
  font-size: 0.9rem;
}
</style>