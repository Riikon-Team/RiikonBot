import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import * as db from '../database/db.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Update the packages directory to remove the 'available' subdirectory
const PACKAGES_DIR = __dirname;
// Define packages to be excluded because their functionality is included in standard package
const EXCLUDED_PACKAGES = ['help', 'ping-pong', 'packageManager.js', 'index.js'];

class PackageManager {
  constructor() {
    this.packages = new Map();
    this.events = new Map();
    this.webRoutes = new Map();
    this.defaultPackage = null;
  }
  
  registerEventListener(eventName, callback, packageName) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    
    this.events.get(eventName).push({
      callback,
      packageName
    });
    
    logger.debug(`Package [${packageName}] registered event listener for [${eventName}]`);
  }
  
  registerWebRoute(routePath, routeHandler, packageName, viewsPath = null) {
    this.webRoutes.set(packageName, {
      path: routePath,
      handler: routeHandler,
      views: viewsPath // Store the path to package-specific views
    });
    
    logger.debug(`Package ${packageName} registered web route at ${routePath}`);
    return true;
  }
  
  getWebRoutes() {
    return this.webRoutes;
  }
  
  // Emit an event to all registered listeners
  async emitEvent(eventName, ...args) {
    if (!this.events.has(eventName)) return;
    
    const listeners = this.events.get(eventName);
    
    for (const listener of listeners) {
      try {
        // Check if the package is enabled before processing the event
        const pkg = this.packages.get(listener.packageName);
        if (pkg && pkg.enabled) {
          await listener.callback(...args);
        }
      } catch (error) {
        logger.error(`Error in package ${listener.packageName} handling event ${eventName}:`, error);
      }
    }
  }
  
  // Load a package from its directory
  async loadPackage(packageDir) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
      const packageName = packageJson.name;
      
      // Skip excluded packages
      if (EXCLUDED_PACKAGES.includes(packageName)) {
        logger.info(`Skipping package ${packageName} as its functionality is included in standard package`);
        return null;
      }
      
      // Check if package exists in database, create if not
      let pkgEntity = await db.getPackageByName(packageName);
      
      if (!pkgEntity) {
        pkgEntity = await db.createPackage({
          name: packageName,
          version: packageJson.version,
          enabled: true,
          config: typeof packageJson.config === 'string' ? 
            packageJson.config : 
            JSON.stringify(packageJson.config || {})
        });
      }
      
      // Import the package's main file - Convert Windows path to file:// URL
      const mainFilePath = path.join(packageDir, packageJson.main || 'index.js');
      const packageModule = await import(pathToFileURL(mainFilePath).href);
      
      // Store the package in our map
      this.packages.set(packageName, {
        name: packageName,
        version: packageJson.version,
        enabled: pkgEntity.enabled,
        config: typeof pkgEntity.config === 'string' ? 
          JSON.parse(pkgEntity.config) : 
          pkgEntity.config,
        module: packageModule,
        manifest: packageJson,
        isDefault: packageJson.isDefault || false
      });
      
      // Check if this is the default package
      if (packageJson.isDefault) {
        this.defaultPackage = packageName;
        logger.info(`Set ${packageName} as the default package`);
      }
      
      logger.info(`Loaded package: ${packageName} v${packageJson.version}`);
      return packageName;
    } catch (error) {
      logger.error(`Failed to load package from ${packageDir}:`, error);
      return null;
    }
  }
  
  // Initialize all loaded packages
  async initializePackages(client) {
    // First initialize the default package if it exists
    if (this.defaultPackage) {
      const pkg = this.packages.get(this.defaultPackage);
      if (pkg && pkg.enabled && pkg.module.initialize) {
        try {
          await pkg.module.initialize(client, this, pkg.config);
          logger.info(`Initialized default package: [${this.defaultPackage}]`);
        } catch (error) {
          logger.error(`Failed to initialize default package [${this.defaultPackage}]:`, error);
        }
      }
    }
    
    // Then initialize other packages
    for (const [name, pkg] of this.packages) {
      if (name !== this.defaultPackage && pkg.enabled && pkg.module.initialize) {
        try {
          await pkg.module.initialize(client, this, pkg.config);
          logger.info(`Initialized package: [${name}]`);
        } catch (error) {
          logger.error(`Failed to initialize package [${name}]:`, error);
        }
      }
    }
  }
  
  // Enable or disable a package
  async togglePackage(packageName, enabled) {
    const pkg = this.packages.get(packageName);
    if (!pkg) return false;
    
    try {
      // Update database
      await db.togglePackage(packageName, enabled);
      
      // Update local cache
      pkg.enabled = enabled;
      
      // Call lifecycle hooks if they exist
      if (enabled && pkg.module.onEnable) {
        await pkg.module.onEnable();
      } else if (!enabled && pkg.module.onDisable) {
        await pkg.module.onDisable();
      }
      
      logger.info(`Package ${packageName} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    } catch (error) {
      logger.error(`Failed to ${enabled ? 'enable' : 'disable'} package ${packageName}:`, error);
      return false;
    }
  }
  
  // Get all packages
  getAllPackages() {
    return Array.from(this.packages.values()).map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      enabled: pkg.enabled,
      description: pkg.manifest.description,
      author: pkg.manifest.author,
      config: pkg.config,
      route: pkg.manifest.route || null,
      isDefault: pkg.manifest.isDefault || false
    }));
  }
  
  // Get the default package
  getDefaultPackage() {
    return this.defaultPackage ? this.packages.get(this.defaultPackage) : null;
  }
}

// Create and load all packages
export async function loadPackages() {
  const packageManager = new PackageManager();
  
  // Ensure packages directory exists
  if (!fs.existsSync(PACKAGES_DIR)) {
    fs.mkdirSync(PACKAGES_DIR, { recursive: true });
  }
  
  // Load each package in the directory, filtering out excluded packages
  const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !EXCLUDED_PACKAGES.includes(dirent.name))
    .map(dirent => path.join(PACKAGES_DIR, dirent.name));
  
  logger.info(`Found ${packageDirs.length} packages to load. Excluded: ${EXCLUDED_PACKAGES.join(', ')}`);
  
  for (const packageDir of packageDirs) {
    await packageManager.loadPackage(packageDir);
  }
  
  return packageManager;
}

export default PackageManager;
