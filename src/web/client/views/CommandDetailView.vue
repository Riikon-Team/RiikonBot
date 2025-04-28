<template>
    <div class="command-page">
        <!-- Back button -->
        <router-link to="/guilds" class="btn btn-sm btn-outline-secondary mb-3">
            <i class="bi bi-arrow-left me-1"></i> Back to Servers
        </router-link>

        <!-- Loading state -->
        <div v-if="loading" class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading command details...</p>
        </div>
        <!-- Error state -->
        <div v-else-if="error" class="alert alert-danger">
            {{ error }}
        </div>

        <!-- Main Display -->
        <template v-else>
            <!-- Command header -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <!-- Detail here -->
                    </div>
                </div>
            </div>

            <!-- Tab navigation -->
            <ul class="nav nav-tabs mb-4">
                <li class="nav-item">
                    <a class="nav-link" :class="{ active: activeTab === 'overview' }"
                        @click.prevent="activeTab = 'overview'" href="#">
                        <i class="bi bi-info-circle me-1"></i> Overview
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{ active: activeTab === 'commands' }"
                        @click.prevent="activeTab = 'commands'" href="#">
                        <i class="bi bi-option me-1"></i> Option
                    </a>
                </li>
            </ul>

            <!-- Overview Tab -->
            <div v-show="activeTab === 'overview'" class="tab-content">
                <div class="row">
                    <!-- Server Settings Card -->
                    <div class="col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Server Settings</h5>
                            </div>
                            <div class="card-body">
                                <form @submit.prevent="updatePrefix">
                                    <div class="mb-3">
                                        <label for="prefix" class="form-label">Command Prefix</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control" id="prefix" v-model="prefix"
                                                :disabled="updatingPrefix" required>
                                            <button class="btn btn-primary" type="submit"
                                                :disabled="updatingPrefix || prefix === guild.prefix || !prefix">
                                                <span v-if="updatingPrefix"
                                                    class="spinner-border spinner-border-sm me-1" role="status"></span>
                                                Update
                                            </button>
                                        </div>
                                        <small class="form-text text-muted">
                                            This prefix is used for text commands in this server.
                                        </small>
                                    </div>
                                </form>

                                <div v-if="prefixUpdateSuccess" class="alert alert-success mt-3">
                                    Prefix updated successfully!
                                </div>
                                <div v-if="prefixUpdateError" class="alert alert-danger mt-3">
                                    {{ prefixUpdateError }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Server Stats Card -->
                    <div class="col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Server Statistics</h5>
                            </div>
                            <div class="card-body">
                                <div class="row g-0">
                                    <div class="col-6 mb-3">
                                        <div class="d-flex align-items-center">
                                            <div class="stat-icon bg-primary text-white rounded p-2 me-2">
                                                <i class="bi bi-people"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">{{ guild.stats?.members.total || guild.memberCount }}
                                                </h6>
                                                <small class="text-muted">Total Members</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-6 mb-3">
                                        <div class="d-flex align-items-center">
                                            <div class="stat-icon bg-success text-white rounded p-2 me-2">
                                                <i class="bi bi-person-check"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">{{ guild.stats?.members.online || 'N/A' }}</h6>
                                                <small class="text-muted">Online Members</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-6 mb-3">
                                        <div class="d-flex align-items-center">
                                            <div class="stat-icon bg-info text-white rounded p-2 me-2">
                                                <i class="bi bi-hash"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">{{ guild.stats?.channels.total || 'N/A' }}</h6>
                                                <small class="text-muted">Channels</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-6 mb-3">
                                        <div class="d-flex align-items-center">
                                            <div class="stat-icon bg-warning text-white rounded p-2 me-2">
                                                <i class="bi bi-tags"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">{{ guild.stats?.roles.total || 'N/A' }}</h6>
                                                <small class="text-muted">Roles</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-6">
                                        <div class="d-flex align-items-center">
                                            <div class="stat-icon bg-secondary text-white rounded p-2 me-2">
                                                <i class="bi bi-robot"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">{{ guild.stats?.members.botCount || 'N/A' }}</h6>
                                                <small class="text-muted">Bots</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-6">
                                        <div class="d-flex align-items-center">
                                            <div class="stat-icon bg-danger text-white rounded p-2 me-2">
                                                <i class="bi bi-emoji-smile"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">{{ guild.stats?.emojis.total || 'N/A' }}</h6>
                                                <small class="text-muted">Emojis</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Features and Info -->
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Server Features</h5>
                            </div>
                            <div class="card-body">
                                <div v-if="guild.features && guild.features.length" class="d-flex flex-wrap gap-2">
                                    <span v-for="feature in guild.features" :key="feature" class="badge bg-primary">
                                        {{ formatFeature(feature) }}
                                    </span>
                                </div>
                                <p v-else class="text-muted mb-0">This server does not have any special features.</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Additional Information</h5>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item bg-transparent d-flex justify-content-between">
                                        <span class="text-muted">Server ID</span>
                                        <span>{{ guild.id }}</span>
                                    </li>
                                    <li class="list-group-item bg-transparent d-flex justify-content-between">
                                        <span class="text-muted">Created At</span>
                                        <span>{{ guild.createdAt ? new Date(guild.createdAt).toLocaleString() :
                                            'Unknown' }}</span>
                                    </li>
                                    <li class="list-group-item bg-transparent d-flex justify-content-between">
                                        <span class="text-muted">Verification Level</span>
                                        <span>{{ formatVerificationLevel(guild.verificationLevel) }}</span>
                                    </li>
                                    <li v-if="guild.vanityURLCode"
                                        class="list-group-item bg-transparent d-flex justify-content-between">
                                        <span class="text-muted">Vanity URL</span>
                                        <span>discord.gg/{{ guild.vanityURLCode }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Option Tab -->
            <div v-show="activeTab === 'option'" class="tab-content">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Server Commands</h5>
                        <div class="input-group" style="max-width: 300px;">
                            <input type="text" class="form-control" placeholder="Search commands..."
                                v-model="commandSearch">
                            <span class="input-group-text">
                                <i class="bi bi-search"></i>
                            </span>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th style="width: 100px;">Type</th>
                                        <th style="width: 100px;">Enabled</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="commands.length === 0">
                                        <td colspan="4" class="text-center py-4">No commands available for this server.
                                        </td>
                                    </tr>
                                    <tr v-for="command in filteredCommands" :key="command.name + command.type">
                                        <td>{{ command.name }}</td>
                                        <td>{{ command.description }}</td>
                                        <td>
                                            <span
                                                :class="command.type === 'SLASH' ? 'badge bg-primary' : 'badge bg-secondary'">
                                                {{ command.type }}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox"
                                                    :id="`command-${command.name}-${command.type}`"
                                                    v-model="command.enabled" :disabled="command.updating"
                                                    @change="toggleCommand(command)">
                                                <label class="form-check-label"
                                                    :for="`command-${command.name}-${command.type}`">
                                                    <span v-if="command.updating"
                                                        class="spinner-border spinner-border-sm" role="status"></span>
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </template>
    </div>

</template>

<script>
export default {
    name: "CommandDetailView",
    data() {
        return {
            loading: true,
            error: null,
            commands: [],
            searchQuery: '',
            typeFilter: 'all',
            sortField: 'name',
            sortDirection: 'asc'
        }
    }
}
</script>

<style></style>