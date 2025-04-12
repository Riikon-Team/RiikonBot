<template>
    <div>
      <h1 class="mb-4">Server Settings</h1>
  
      <v-card v-if="loading">
        <v-card-text class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          Loading server details...
        </v-card-text>
      </v-card>
  
      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>
  
      <template v-else>
        <v-card class="mb-4">
          <v-card-title class="primary">
            <h2>Server Information</h2>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="d-flex align-center mb-4">
                  <v-avatar size="64" class="mr-4" v-if="guild.icon">
                    <v-img :src="guild.icon"></v-img>
                  </v-avatar>
                  <v-avatar size="64" class="mr-4" v-else color="primary">
                    {{ guild.name ? guild.name.charAt(0) : 'S' }}
                  </v-avatar>
                  <div>
                    <h3 class="text-h5">{{ guild.name }}</h3>
                    <div class="text-subtitle-2">ID: {{ guild.id }}</div>
                  </div>
                </div>
  
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon>mdi-account-group</v-icon>
                    </template>
                    <v-list-item-title>Members</v-list-item-title>
                    <v-list-item-subtitle>{{ guild.memberCount }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-card>
                  <v-card-title>Prefix Settings</v-card-title>
                  <v-card-text>
                    <v-text-field
                      v-model="prefix"
                      label="Command Prefix"
                      hint="This prefix is used for text commands"
                      :rules="[v => !!v || 'Prefix is required']"
                    ></v-text-field>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      :disabled="prefix === guild.prefix || !prefix"
                      @click="updatePrefix"
                      :loading="updating"
                    >
                      Update Prefix
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
  
        <v-card>
          <v-card-title class="primary">
            <h2>Commands</h2>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-data-table
                  :headers="commandHeaders"
                  :items="commands"
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
                  <template v-slot:item.enabled="{ item }">
                    <v-switch
                      v-model="item.enabled"
                      :loading="item.updating"
                      @change="toggleCommand(item)"
                    ></v-switch>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </template>
    </div>
  </template>
  
  <script>
  export default {
    name: 'GuildDetailView',
    data() {
      return {
        loading: true,
        updating: false,
        error: null,
        guild: {},
        prefix: '',
        commands: [],
        commandHeaders: [
          { title: 'Name', key: 'name' },
          { title: 'Description', key: 'description' },
          { title: 'Type', key: 'type' },
          { title: 'Enabled', key: 'enabled', sortable: false }
        ]
      };
    },
    async created() {
      this.loadGuildData();
    },
    methods: {
      async loadGuildData() {
        try {
          this.loading = true;
          const guildId = this.$route.params.id;
          
          // Fetch guild data
          const response = await fetch(`/api/guilds/${guildId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          this.guild = await response.json();
          this.prefix = this.guild.prefix || '!';
          
          // Initialize commands with server-specific enabled status
          this.commands = this.guild.commands.map(cmd => ({
            ...cmd,
            updating: false
          }));
          
          this.loading = false;
        } catch (error) {
          this.error = `Error loading server data: ${error.message}`;
          console.error('Error fetching guild data:', error);
          this.loading = false;
        }
      },
      
      async updatePrefix() {
        if (!this.prefix || this.prefix === this.guild.prefix) return;
        
        try {
          this.updating = true;
          const response = await fetch(`/api/guilds/${this.guild.id}/prefix`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prefix: this.prefix })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          this.guild.prefix = result.prefix;
          
          // Show success message or notification
        } catch (error) {
          this.error = `Error updating prefix: ${error.message}`;
          console.error('Error updating prefix:', error);
        } finally {
          this.updating = false;
        }
      },
      
      async toggleCommand(command) {
        const index = this.commands.findIndex(c => c.id === command.id);
        if (index === -1) return;
        
        try {
          this.commands[index].updating = true;
          
          const response = await fetch(`/api/commands/${this.guild.id}/${command.name}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              enabled: command.enabled,
              type: command.type
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          // Update the command with the result from the server
          this.commands[index].enabled = result.enabled;
          
        } catch (error) {
          // Revert the toggle if there was an error
          this.commands[index].enabled = !this.commands[index].enabled;
          this.error = `Error updating command: ${error.message}`;
          console.error('Error updating command:', error);
        } finally {
          this.commands[index].updating = false;
        }
      }
    }
  };
  </script>