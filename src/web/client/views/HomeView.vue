<template>
    <div>
      <v-card class="mb-4">
        <v-card-title class="primary">
          <h2>Bot Information</h2>
        </v-card-title>
        <v-card-text v-if="loading">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          Loading...
        </v-card-text>
        <v-card-text v-else-if="error">
          <v-alert type="error">{{ error }}</v-alert>
        </v-card-text>
        <v-card-text v-else>
          <v-row>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-robot</v-icon>
                  </template>
                  <v-list-item-title>{{ botInfo.username }}</v-list-item-title>
                  <v-list-item-subtitle>ID: {{ botInfo.id }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-server</v-icon>
                  </template>
                  <v-list-item-title>Servers</v-list-item-title>
                  <v-list-item-subtitle>{{ botInfo.guilds }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-account-group</v-icon>
                  </template>
                  <v-list-item-title>Users</v-list-item-title>
                  <v-list-item-subtitle>{{ botInfo.users }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" to="/guilds">
            Manage Servers
            <v-icon right>mdi-arrow-right</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HomeView',
    data() {
      return {
        loading: true,
        error: null,
        botInfo: {}
      };
    },
    async mounted() {
      try {
        const response = await fetch('/api/bot');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.botInfo = await response.json();
      } catch (error) {
        this.error = `Error loading bot info: ${error.message}`;
        console.error('Error fetching bot info:', error);
      } finally {
        this.loading = false;
      }
    }
  };
  </script>