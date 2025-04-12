<template>
    <div>
      <h1 class="mb-4">Servers</h1>
      
      <v-card v-if="loading">
        <v-card-text class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          Loading servers...
        </v-card-text>
      </v-card>
      
      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>
      
      <div v-else-if="guilds.length === 0" class="text-center">
        <v-alert type="info">No servers found</v-alert>
      </div>
      
      <v-row v-else>
        <v-col v-for="guild in guilds" :key="guild.id" cols="12" md="6" lg="4">
          <v-card class="h-100">
            <v-card-title>
              <v-avatar class="mr-3" v-if="guild.icon">
                <v-img :src="guild.icon"></v-img>
              </v-avatar>
              <v-avatar class="mr-3" v-else color="primary">
                {{ guild.name.charAt(0) }}
              </v-avatar>
              {{ guild.name }}
            </v-card-title>
            <v-card-text>
              <div><strong>ID:</strong> {{ guild.id }}</div>
              <div><strong>Members:</strong> {{ guild.memberCount }}</div>
              <div><strong>Prefix:</strong> {{ guild.prefix || '!' }}</div>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" :to="`/guilds/${guild.id}`">
                Manage
                <v-icon right>mdi-cog</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </template>
  
  <script>
  export default {
    name: 'GuildListView',
    data() {
      return {
        loading: true,
        error: null,
        guilds: []
      };
    },
    async mounted() {
      try {
        const response = await fetch('/api/guilds');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.guilds = await response.json();
      } catch (error) {
        this.error = `Error loading servers: ${error.message}`;
        console.error('Error fetching guilds:', error);
      } finally {
        this.loading = false;
      }
    }
  };
  </script>