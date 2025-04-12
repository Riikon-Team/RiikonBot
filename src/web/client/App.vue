<template>
  <v-app>
    <v-app-bar app color="primary">
      <v-app-bar-title>RiikonBot Dashboard</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn to="/" text>Home</v-btn>
      <v-btn to="/guilds" text>Servers</v-btn>
      <v-btn to="/commands" text>Commands</v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>

    <v-footer app>
      <div class="text-center w-100">
        &copy; {{ new Date().getFullYear() }} — RiikonBot
      </div>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'App'
};
</script>