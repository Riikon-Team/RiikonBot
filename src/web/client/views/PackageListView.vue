<template>
  <div class="packages-page">
    <h2 class="mb-4">Packages</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading packages...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- Empty state -->
    <div v-else-if="packages.length === 0" class="text-center p-5">
      <i class="bi bi-box fs-1 text-muted"></i>
      <p class="mt-2">No packages found</p>
    </div>
    
    <template v-else>
      <!-- Packages overview -->
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card bg-primary text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="card-title h2">{{ packages.length }}</h5>
                  <h6 class="card-subtitle">Total Packages</h6>
                </div>
                <div>
                  <i class="bi bi-box fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card bg-success text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="card-title h2">{{ enabledPackagesCount }}</h5>
                  <h6 class="card-subtitle">Enabled</h6>
                </div>
                <div>
                  <i class="bi bi-check-circle fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card bg-danger text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="card-title h2">{{ disabledPackagesCount }}</h5>
                  <h6 class="card-subtitle">Disabled</h6>
                </div>
                <div>
                  <i class="bi bi-x-circle fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3 col-sm-6 mb-3">
          <div class="card bg-info text-white h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="card-title h2">{{ commandsCount }}</h5>
                  <h6 class="card-subtitle">Commands</h6>
                </div>
                <div>
                  <i class="bi bi-terminal fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Packages List -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Installed Packages</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 80px;">Status</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th style="width: 100px;">Version</th>
                  <th style="width: 100px;">Commands</th>
                  <th style="width: 150px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pkg in packages" :key="pkg.name">
                  <td>
                    <div class="form-check form-switch">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        :id="`pkg-${pkg.name}`" 
                        v-model="pkg.enabled"
                        :disabled="pkg.updating || pkg.core"
                        @change="togglePackage(pkg)"
                      >
                      <label 
                        class="form-check-label" 
                        :for="`pkg-${pkg.name}`"
                      >
                        <span v-if="pkg.updating" class="spinner-border spinner-border-sm" role="status"></span>
                      </label>
                    </div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <i class="bi" :class="pkg.icon || 'bi-box'" style="font-size: 1.2rem;"></i>
                      <div class="ms-2">
                        <div class="fw-bold">{{ pkg.name }}</div>
                        <div class="text-muted small" v-if="pkg.author">
                          by {{ pkg.author }}
                        </div>
                      </div>
                      <span v-if="pkg.core" class="badge bg-secondary ms-2">Core</span>
                    </div>
                  </td>
                  <td>{{ pkg.description }}</td>
                  <td>{{ pkg.version || 'N/A' }}</td>
                  <td>{{ pkg.commandCount || 0 }}</td>
                  <td>
                    <router-link 
                      :to="`/packages/${pkg.name}`" 
                      class="btn btn-sm btn-primary me-2"
                      :disabled="!pkg.hasConfig"
                    >
                      <i class="bi bi-gear-fill"></i>
                    </router-link>
                    <button 
                      class="btn btn-sm btn-info" 
                      @click="showPackageInfo(pkg)"
                    >
                      <i class="bi bi-info-circle"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Package Info Modal -->
      <div class="modal fade" id="packageInfoModal" tabindex="-1" aria-hidden="true" ref="packageModal">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header">
              <h5 class="modal-title" v-if="selectedPackage">{{ selectedPackage.name }}</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" v-if="selectedPackage">
              <div class="mb-3" v-if="selectedPackage.description">
                <h6>Description</h6>
                <p>{{ selectedPackage.description }}</p>
              </div>
              
              <div class="mb-3" v-if="selectedPackage.version">
                <h6>Version</h6>
                <p>{{ selectedPackage.version }}</p>
              </div>
              
              <div class="mb-3" v-if="selectedPackage.author">
                <h6>Author</h6>
                <p>{{ selectedPackage.author }}</p>
              </div>
              
              <div class="mb-3" v-if="selectedPackage.dependencies && selectedPackage.dependencies.length">
                <h6>Dependencies</h6>
                <ul class="list-unstyled">
                  <li v-for="dep in selectedPackage.dependencies" :key="dep">
                    <span class="badge bg-secondary me-2">{{ dep }}</span>
                  </li>
                </ul>
              </div>
              
              <div class="mb-0" v-if="selectedPackage.commands && selectedPackage.commands.length">
                <h6>Commands</h6>
                <ul class="list-unstyled">
                  <li v-for="cmd in selectedPackage.commands" :key="cmd.name">
                    <span class="badge" :class="cmd.type === 'SLASH' ? 'bg-primary' : 'bg-secondary'">
                      {{ cmd.type }}
                    </span>
                    <span class="ms-2">{{ cmd.name }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <router-link 
                v-if="selectedPackage && selectedPackage.hasConfig" 
                :to="`/packages/${selectedPackage.name}`" 
                class="btn btn-primary"
              >
                Configure
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'PackageListView',
  data() {
    return {
      loading: true,
      error: null,
      packages: [],
      selectedPackage: null,
      packageModal: null
    };
  },
  computed: {
    enabledPackagesCount() {
      return this.packages.filter(pkg => pkg.enabled).length;
    },
    disabledPackagesCount() {
      return this.packages.filter(pkg => !pkg.enabled).length;
    },
    commandsCount() {
      return this.packages.reduce((total, pkg) => total + (pkg.commandCount || 0), 0);
    }
  },
  async created() {
    try {
      const packages = await this.$api.packages.getAllPackages();
      this.packages = packages.map(pkg => ({
        ...pkg,
        updating: false
      }));
    } catch (error) {
      this.error = `Error loading packages: ${error.message}`;
      console.error('Error fetching packages:', error);
    } finally {
      this.loading = false;
    }
  },
  mounted() {
    // Initialize Bootstrap modal
    const modalElement = this.$refs.packageModal;
    if (modalElement) {
      this.packageModal = new bootstrap.Modal(modalElement);
    }
  },
  methods: {
    async togglePackage(pkg) {
      if (pkg.core) {
        pkg.enabled = true;
        return;
      }
      
      try {
        pkg.updating = true;
        
        const result = await this.$api.packages.updatePackageStatus(pkg.name, pkg.enabled);
        pkg.enabled = result.enabled;
      } catch (error) {
        // Revert the toggle if there was an error
        pkg.enabled = !pkg.enabled;
        this.error = `Error updating package: ${error.message}`;
        console.error('Error updating package:', error);
      } finally {
        pkg.updating = false;
      }
    },
    
    showPackageInfo(pkg) {
      this.selectedPackage = pkg;
      if (this.packageModal) {
        this.packageModal.show();
      }
    }
  }
};
</script>
