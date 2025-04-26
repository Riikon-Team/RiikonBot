<template>
  <div class="commands-page">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Commands</h2>
      <div class="search-box">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search commands..." 
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
      <p class="mt-2">Loading commands...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- Empty state -->
    <div v-else-if="commands.length === 0" class="text-center p-5">
      <i class="bi bi-terminal fs-1 text-muted"></i>
      <p class="mt-2">No commands found</p>
    </div>
    
    <template v-else>
      <!-- Command type filter buttons -->
      <div class="mb-4">
        <div class="btn-group" role="group">
          <button 
            type="button" 
            class="btn" 
            :class="typeFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'" 
            @click="typeFilter = 'all'"
          >
            All
          </button>
          <button 
            type="button" 
            class="btn" 
            :class="typeFilter === 'SLASH' ? 'btn-primary' : 'btn-outline-primary'" 
            @click="typeFilter = 'SLASH'"
          >
            Slash Commands
          </button>
          <button 
            type="button" 
            class="btn" 
            :class="typeFilter === 'PREFIX' ? 'btn-primary' : 'btn-outline-primary'" 
            @click="typeFilter = 'PREFIX'"
          >
            PREFIX Commands
          </button>
        </div>
      </div>
      
      <!-- Commands Table -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Global Commands</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th @click="sortBy('name')" style="cursor: pointer" class="user-select-none">
                    Name
                    <i v-if="sortField === 'name'" :class="sortDirection === 'asc' ? 'bi bi-caret-up-fill' : 'bi bi-caret-down-fill'"></i>
                  </th>
                  <th>Description</th>
                  <th @click="sortBy('type')" style="cursor: pointer; width: 120px;" class="user-select-none">
                    Type
                    <i v-if="sortField === 'type'" :class="sortDirection === 'asc' ? 'bi bi-caret-up-fill' : 'bi bi-caret-down-fill'"></i>
                  </th>
                  <th style="width: 150px;">Package</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="command in filteredAndSortedCommands" :key="command.name + command.type">
                  <td>
                    <span class="fw-bold">{{ command.prefix ? command.prefix : ""}}{{ command.name }}</span>
                    <div v-if="command.aliases && command.aliases.length" class="text-muted small">
                      Aliases: {{ command.aliases.join(', ') }}
                    </div>
                  </td>
                  <td>{{ command.description }}</td>
                  <td>
                    <span :class="command.type === 'SLASH' ? 'badge bg-primary' : 'badge bg-secondary'">
                      {{ command.type }}
                    </span>
                  </td>
                  <td>
                    <span class="badge bg-info" v-if="command.package">
                      {{ command.package }}
                    </span>
                    <span class="badge bg-secondary" v-else>
                      Core
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Usage Examples Section -->
      <div class="card mt-4">
        <div class="card-header">
          <h5 class="mb-0">Usage Examples</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6 mb-3 mb-md-0">
              <div class="card h-100">
                <div class="card-header bg-primary text-white">
                  <h6 class="mb-0">Slash Commands</h6>
                </div>
                <div class="card-body">
                  <p>Slash commands are used by typing <code>/</code> followed by the command name.</p>
                  <div class="example-command p-2 rounded mb-2">
                    <code>/help</code> - Shows help information
                  </div>
                  <div class="example-command p-2 rounded mb-2">
                    <code>/play [song]</code> - Plays a song in voice channel
                  </div>
                  <p class="text-muted small mb-0">
                    Slash commands work the same in all servers and don't need a prefix.
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card h-100">
                <div class="card-header bg-secondary text-white">
                  <h6 class="mb-0">PREFIX Commands</h6>
                </div>
                <div class="card-body">
                  <p>PREFIX commands use the server's prefix followed by the command name.</p>
                  <div class="example-command p-2 rounded mb-2">
                    <code>!help</code> - Shows help information
                  </div>
                  <div class="example-command p-2 rounded mb-2">
                    <code>!play [song]</code> - Plays a song in voice channel
                  </div>
                  <p class="text-muted small mb-0">
                    The default prefix is <code>!</code> but it can be changed for each server.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'CommandListView',
  data() {
    return {
      loading: true,
      error: null,
      commands: [],
      searchQuery: '',
      typeFilter: 'all',
      sortField: 'name',
      sortDirection: 'asc'
    };
  },
  computed: {
    filteredAndSortedCommands() {
      // First, filter by search query and type
      let filtered = this.commands;
      console.log(this.commands)
      if (this.typeFilter !== 'all') {
        filtered = filtered.filter(cmd => cmd.type === this.typeFilter);
      }
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(cmd => 
          cmd.name.toLowerCase().includes(query) || 
          cmd.description.toLowerCase().includes(query) ||
          (cmd.aliases && cmd.aliases.some(alias => alias.toLowerCase().includes(query)))
        );
      }
      
      // Then, sort the results
      return filtered.sort((a, b) => {
        const fieldA = a[this.sortField];
        const fieldB = b[this.sortField];
        
        if (this.sortDirection === 'asc') {
          return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
        } else {
          return fieldA > fieldB ? -1 : fieldA < fieldB ? 1 : 0;
        }
      });
    }
  },
  async created() {
    try {
      this.commands = await this.$api.commands.getAllCommands();
    } catch (error) {
      this.error = `Error loading commands: ${error.message}`;
      console.error('Error fetching commands:', error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    sortBy(field) {
      if (this.sortField === field) {
        // If already sorting by this field, toggle direction
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        // New sort field, default to ascending
        this.sortField = field;
        this.sortDirection = 'asc';
      }
    }
  }
};
</script>

<style scoped>
.example-command {
  background-color: var(--lighter);
  border-left: 3px solid var(--primary);
}

code {
  color: var(--primary);
  background-color: #ff8c3f17;
  padding: 2px 4px;
  border-radius: 3px;
}
</style>