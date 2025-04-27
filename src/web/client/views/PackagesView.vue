<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <h2 class="mb-4">Package Management</h2>
        
        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        
        <div v-else class="row">
          <!-- Package cards -->
          <div v-for="pkg in packages" :key="pkg.name" class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">{{ pkg.name }}</h5>
                <div class="form-check form-switch">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    :id="`switch-${pkg.name}`" 
                    v-model="pkg.enabled"
                    @change="togglePackage(pkg)"
                    :disabled="updatingStatus[pkg.name]"
                  >
                  <label class="form-check-label" :for="`switch-${pkg.name}`">
                    {{ pkg.enabled ? 'Enabled' : 'Disabled' }}
                  </label>
                </div>
              </div>
              <div class="card-body">
                <p class="card-text">{{ pkg.description || 'No description available' }}</p>
                <div class="mb-3">
                  <small class="text-muted">Version: {{ pkg.version || 'Unknown' }}</small>
                </div>
                
                <div class="d-flex justify-content-between">
                  <button 
                    class="btn btn-sm btn-primary" 
                    @click="openConfigModal(pkg)"
                    v-if="pkg.hasConfig"
                  >
                    Configure
                  </button>
                  <span class="badge bg-secondary">{{ pkg.type || 'Package' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Configuration Modal -->
    <div class="modal fade" id="configModal" tabindex="-1" aria-labelledby="configModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="configModalLabel">
              Configure {{ selectedPackage?.name }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="configLoading" class="text-center my-3">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading configuration...</span>
              </div>
            </div>
            <div v-else-if="configError" class="alert alert-danger">
              {{ configError }}
            </div>
            <div v-else>
              <form>
                <div v-for="(value, key) in packageConfig" :key="key" class="mb-3">
                  <label :for="`config-${key}`" class="form-label">{{ formatLabel(key) }}</label>
                  
                  <!-- Boolean values as toggle switches -->
                  <div v-if="typeof value === 'boolean'" class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :id="`config-${key}`"
                      v-model="packageConfig[key]"
                    >
                  </div>
                  
                  <!-- Numbers as number inputs -->
                  <input
                    v-else-if="typeof value === 'number'"
                    type="number"
                    class="form-control"
                    :id="`config-${key}`"
                    v-model.number="packageConfig[key]"
                  >
                  
                  <!-- Simple text input for strings -->
                  <input
                    v-else-if="typeof value === 'string' && value.length < 100"
                    type="text"
                    class="form-control"
                    :id="`config-${key}`"
                    v-model="packageConfig[key]"
                  >
                  
                  <!-- Textarea for longer strings -->
                  <textarea
                    v-else-if="typeof value === 'string'"
                    class="form-control"
                    :id="`config-${key}`"
                    rows="3"
                    v-model="packageConfig[key]"
                  ></textarea>
                  
                  <!-- JSON editor for objects -->
                  <textarea
                    v-else
                    class="form-control"
                    :id="`config-${key}`"
                    rows="5"
                    v-model="jsonConfigValues[key]"
                    @change="updateJsonConfig(key)"
                  ></textarea>
                </div>
              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="saveConfig" 
              :disabled="configSaving"
            >
              <span v-if="configSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Notifications -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div 
        id="liveToast" 
        class="toast hide" 
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true"
      >
        <div class="toast-header" :class="toastClass">
          <strong class="me-auto">{{ toastTitle }}</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          {{ toastMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal, Toast } from 'bootstrap';

export default {
  name: 'PackagesView',
  data() {
    return {
      packages: [],
      loading: true,
      error: null,
      updatingStatus: {},
      
      // Configuration modal data
      selectedPackage: null,
      packageConfig: {},
      originalConfig: {},
      jsonConfigValues: {},
      configModal: null,
      configLoading: false,
      configError: null,
      configSaving: false,
      
      // Toast notification data
      toast: null,
      toastTitle: '',
      toastMessage: '',
      toastClass: ''
    };
  },
  computed: {
    sortedPackages() {
      return [...this.packages].sort((a, b) => {
        if (a.enabled === b.enabled) {
          return a.name.localeCompare(b.name);
        }
        return a.enabled ? -1 : 1;
      });
    }
  },
  async mounted() {
    await this.fetchPackages();
    this.configModal = new Modal(document.getElementById('configModal'));
    this.toast = new Toast(document.getElementById('liveToast'));
  },
  methods: {
    async fetchPackages() {
      try {
        this.loading = true;
        const response = await fetch('/api/packages');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch packages: ${response.status} ${response.statusText}`);
        }
        
        this.packages = await response.json();
        // Add hasConfig property based on whether the package has a config
        this.packages = this.packages.map(pkg => ({
          ...pkg,
          hasConfig: Boolean(pkg.config || (pkg.defaultConfig && Object.keys(pkg.defaultConfig).length > 0))
        }));
      } catch (error) {
        this.error = `Error loading packages: ${error.message}`;
        console.error('Error fetching packages:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async togglePackage(pkg) {
      try {
        this.updatingStatus = {...this.updatingStatus, [pkg.name]: true};
        const response = await fetch(`/api/packages/${pkg.name}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enabled: pkg.enabled })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update package status: ${response.status} ${response.statusText}`);
        }
        
        const updatedPackage = await response.json();
        
        // Update the local package data
        const index = this.packages.findIndex(p => p.name === pkg.name);
        if (index !== -1) {
          this.packages[index].enabled = updatedPackage.enabled;
        }
        
        // Show success toast
        this.showToast(
          'Success', 
          `Package "${pkg.name}" ${pkg.enabled ? 'enabled' : 'disabled'} successfully.`,
          'bg-success text-white'
        );
      } catch (error) {
        // Revert the toggle if there was an error
        pkg.enabled = !pkg.enabled;
        
        // Show error toast
        this.showToast(
          'Error', 
          `Failed to update package status: ${error.message}`,
          'bg-danger text-white'
        );
        
        console.error('Error toggling package:', error);
      } finally {
        this.updatingStatus = {...this.updatingStatus, [pkg.name]: false};
      }
    },
    
    async openConfigModal(pkg) {
      this.selectedPackage = pkg;
      this.configLoading = true;
      this.configError = null;
      this.configModal.show();
      
      try {
        const response = await fetch(`/api/packages/${pkg.name}/config`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch package configuration: ${response.status} ${response.statusText}`);
        }
        
        this.packageConfig = await response.json();
        this.originalConfig = JSON.parse(JSON.stringify(this.packageConfig));
        
        // Initialize JSON editor values
        this.jsonConfigValues = {};
        for (const [key, value] of Object.entries(this.packageConfig)) {
          if (typeof value === 'object' && value !== null) {
            this.jsonConfigValues[key] = JSON.stringify(value, null, 2);
          }
        }
      } catch (error) {
        this.configError = `Error loading configuration: ${error.message}`;
        console.error('Error fetching package config:', error);
      } finally {
        this.configLoading = false;
      }
    },
    
    updateJsonConfig(key) {
      try {
        this.packageConfig[key] = JSON.parse(this.jsonConfigValues[key]);
      } catch (error) {
        // If the JSON is invalid, don't update the config
        console.error(`Invalid JSON for ${key}:`, error);
        // Revert to the original JSON string
        this.jsonConfigValues[key] = JSON.stringify(this.packageConfig[key], null, 2);
      }
    },
    
    async saveConfig() {
      if (!this.selectedPackage) return;
      
      try {
        this.configSaving = true;
        const response = await fetch(`/api/packages/${this.selectedPackage.name}/config`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ config: this.packageConfig })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save configuration: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Close the modal
        this.configModal.hide();
        
        // Show success toast
        this.showToast(
          'Success', 
          `Configuration for "${this.selectedPackage.name}" saved successfully.`,
          'bg-success text-white'
        );
      } catch (error) {
        this.showToast(
          'Error', 
          `Failed to save configuration: ${error.message}`,
          'bg-danger text-white'
        );
        
        console.error('Error saving config:', error);
      } finally {
        this.configSaving = false;
      }
    },
    
    formatLabel(key) {
      // Convert camelCase or snake_case to Title Case with spaces
      return key
        .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
    },
    
    showToast(title, message, className) {
      this.toastTitle = title;
      this.toastMessage = message;
      this.toastClass = className;
      this.toast.show();
    }
  }
};
</script>

<style scoped>
.card {
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.form-check-input:checked {
  background-color: #28a745;
  border-color: #28a745;
}

.badge {
  font-size: 0.75em;
}
</style>
