<template>
    <div>
      <h1 class="mb-4">Commands</h1>
      
      <v-card v-if="loading">
        <v-card-text class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          Loading commands...
        </v-card-text>
      </v-card>
      
      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>
      
      <template v-else>
        <v-card>
          <v-card-title>
            <h2>Global Commands</h2>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </v-card-title>
          
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="commands"
              :search="search"
              :items-per-page="10"
              class="elevation-1"
            >
              <template v-slot:item.type="{ item }">
                <v-chip
                  :color="item.type === 'SLASH' ? 'primary' : 'secondary'"
                  size="small"
                >
                  {{ item.type }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
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
        search: '',
        commands: [],
        headers: [
          { title: 'Name', key: 'name', sortable: true },
          { title: 'Description', key: 'description', sortable: true },
          { title: 'Type', key: 'type', sortable: true }
        ]
      };
    },
    async mounted() {
      try {
        const response = await fetch('/api/commands');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.commands = await response.json();
      } catch (error) {
        this.error = `Error loading commands: ${error.message}`;
        console.error('Error fetching commands:', error);
      } finally {
        this.loading = false;
      }
    }
  };
  </script>