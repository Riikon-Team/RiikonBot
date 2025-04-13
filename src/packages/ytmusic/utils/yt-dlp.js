import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { pipeline } from 'stream/promises';
import { createWriteStream, existsSync } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

// Updated paths to use project root /bin directory
const rootDir = path.join(__dirname, '..', '..', '..', '..');
const binDir = path.join(rootDir, 'bin');
const ytdlpPath = path.join(binDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const cookiesPath = path.join(binDir, 'cookies.txt');
const updateCheckFile = path.join(binDir, 'last_update_check.txt');

/**
 * YT-DLP Manager class for handling YouTube audio downloads and streams
 */
export class YTDLPManager {
    constructor(options = {}) {
        this.options = {
            autoUpdate: true,
            updateInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
            cookies: null,
            ...options
        };
        this.initialized = false;
    }

    /**
     * Initialize yt-dlp - ensure binary exists and is up-to-date
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Ensure bin directory exists at the project root level
            await fs.mkdir(binDir, { recursive: true });

            // Check if yt-dlp exists, if not download it
            if (!existsSync(ytdlpPath)) {
                console.log(`yt-dlp binary not found at ${ytdlpPath}. Downloading...`);
                await this.downloadYTDLP();
            }

            // Make binary executable on Unix platforms
            if (process.platform !== 'win32') {
                await fs.chmod(ytdlpPath, 0o755);
            }

            // Check if an update is needed
            if (this.options.autoUpdate) {
                await this.checkForUpdates();
            }

            // Set up cookies if provided
            if (this.options.cookies) {
                await this.setCookies(this.options.cookies);
            }

            this.initialized = true;
            console.log(`yt-dlp initialized successfully at ${ytdlpPath}`);
        } catch (error) {
            console.error('Error initializing yt-dlp:', error);
            throw error;
        }
    }


    /**
     * Download the yt-dlp binary for the current platform to the project root /bin
     */
    async downloadYTDLP() {
        const platform = process.platform;
        let url;
    
        if (platform === 'win32') {
            url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
        } else if (platform === 'darwin') {
            url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
        } else {
            // Default to Linux
            url = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
        }
    
        try {
            console.log(`Downloading yt-dlp from ${url} to ${ytdlpPath}...`);
            
            // Function to follow redirects
            const downloadWithRedirects = async (url, redirectCount = 0) => {
                if (redirectCount > 5) {
                    throw new Error('Too many redirects');
                }
                
                return new Promise((resolve, reject) => {
                    const request = https.get(url, response => {
                        // Handle redirects
                        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                            console.log(`Redirected to: ${response.headers.location}`);
                            downloadWithRedirects(response.headers.location, redirectCount + 1)
                                .then(resolve)
                                .catch(reject);
                            return;
                        }
                        
                        if (response.statusCode !== 200) {
                            reject(new Error(`Failed to download yt-dlp: HTTP status ${response.statusCode}`));
                            return;
                        }
                        
                        const file = createWriteStream(ytdlpPath);
                        pipeline(response, file)
                            .then(() => resolve())
                            .catch(err => {
                                fs.unlink(ytdlpPath).catch(() => {});
                                reject(err);
                            });
                    }).on('error', err => {
                        reject(err);
                    });
                    
                    // Set a timeout
                    request.setTimeout(30000, () => {
                        request.destroy();
                        reject(new Error('Download request timed out'));
                    });
                });
            };
            
            await downloadWithRedirects(url);
            console.log(`yt-dlp successfully downloaded to ${ytdlpPath}`);
        } catch (error) {
            console.error('Error downloading yt-dlp:', error);
            throw error;
        }
    }

    /**
     * Check for updates to yt-dlp
     */
    async checkForUpdates() {
        try {
            // Check if we've checked recently
            let shouldCheck = true;
            try {
                const lastCheckData = await fs.readFile(updateCheckFile, 'utf8');
                const lastCheck = new Date(lastCheckData);
                if ((new Date() - lastCheck) < this.options.updateInterval) {
                    shouldCheck = false;
                }
            } catch (err) {
                // File doesn't exist or can't be read, proceed with check
            }

            if (shouldCheck) {
                console.log('Checking for yt-dlp updates...');
                const { stdout } = await execAsync(`${ytdlpPath} -U`);

                // Update the check timestamp
                await fs.writeFile(updateCheckFile, new Date().toISOString());

                console.log('yt-dlp update check result:', stdout);
            }
        } catch (error) {
            console.error('Error checking for yt-dlp updates:', error);
            // Don't throw here, just log the error
        }
    }

    /**
     * Set YouTube cookies for authentication
     * @param {String} cookiesContent - Content of the cookies.txt file
     */
    async setCookies(cookiesContent) {
        try {
            await fs.writeFile(cookiesPath, cookiesContent);
            console.log('YouTube cookies set successfully');
        } catch (error) {
            console.error('Error setting cookies:', error);
            throw error;
        }
    }

    /**
 * Get direct audio URL for a YouTube video
 * @param {String} videoId - YouTube video ID
 * @param {Object} options - Options for extraction
 * @returns {Promise<String>} - Direct audio URL
 */
    async getDirectAudioUrl(videoId, options = {}) {
        await this.initialize();

        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const args = [
            // Just get URL, don't download
            '--get-url',
            // Audio only
            '-f', 'bestaudio[ext=m4a]/bestaudio/best',
            // Don't show warnings
            '--no-warnings',
            // Quiet mode
            '--quiet'
        ];

        // Add cookies if they exist
        if (existsSync(cookiesPath)) {
            args.push('--cookies', cookiesPath);
        }

        // Add custom options
        if (options.additionalArgs) {
            args.push(...options.additionalArgs);
        }

        // Add URL at the end
        args.push(url);

        try {
            console.log(`Extracting direct URL for video: ${videoId}`);
            const { stdout, stderr } = await execAsync(`${ytdlpPath} ${args.join(' ')}`);

            if (stderr) {
                console.error(`yt-dlp stderr: ${stderr}`);
            }

            const directUrl = stdout.trim();
            if (!directUrl) {
                throw new Error('Failed to extract direct URL');
            }

            console.log(`Successfully extracted audio URL for ${videoId}`);
            return directUrl;
        } catch (error) {
            console.error('Error extracting direct URL:', error);
            throw error;
        }
    }

    /**
     * Stream audio for a YouTube video
     * @param {String} videoId - YouTube video ID
     * @param {Object} options - Options for streaming
     * @returns {Promise<ReadableStream>} - Audio stream
     */
    async streamAudio(videoId, options = {}) {
        await this.initialize();

        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const defaultOptions = [
            // Output to stdout
            '-o', '-',
            // Audio only
            '-f', 'bestaudio[ext=m4a]/bestaudio/best',
            // Extract audio
            '-x',
            // Don't download the entire video before starting
            '--no-part',
            // Don't show download progress
            '--quiet',
            '--no-warnings',
            // Limit fragment retries
            '--fragment-retries', '3',
            // No metadata, no thumbnails
            '--no-write-info-json',
            '--no-write-annotations',
            '--no-write-thumbnail',
            // Thêm các tùy chọn tối ưu tốc độ
            '--force-ipv4',
            '--no-check-certificate', 
            '--prefer-insecure',
            '--geo-bypass',
            // Giảm buffer để có thể bắt đầu stream nhanh hơn
            '--buffer-size', '16K',
            // Tắt các tính năng không cần thiết
            '--no-playlist',
            '--no-simulate',
            '--no-progress',
            // Tối ưu kết nối mạng
            '--concurrent-fragments', '3',
        ];

        // Add cookies if they exist
        if (existsSync(cookiesPath)) {
            defaultOptions.push('--cookies', cookiesPath);
        }

        // Custom user options
        if (options.additionalArgs) {
            defaultOptions.push(...options.additionalArgs);
        }

        // Add the URL at the end
        defaultOptions.push(url);

        console.log(`Starting yt-dlp stream for video: ${videoId}`);

        return new Promise((resolve, reject) => {
            const ytDlp = spawn(ytdlpPath, defaultOptions, {
                stdio: ['ignore', 'pipe', 'pipe'],
                // Tăng priority cho process
                windowsHide: true
            });

            let stderrData = '';

            // Handle errors on streams
            ytDlp.stderr.on('data', (data) => {
                stderrData += data.toString();
                console.error(`yt-dlp stderr: ${data}`);
            });

            ytDlp.on('error', (error) => {
                console.error(`yt-dlp process error: ${error}`);
                reject(error);
            });

            ytDlp.on('close', (code) => {
                if (code !== 0 && code !== null) {
                    const error = new Error(`yt-dlp process exited with code ${code}: ${stderrData}`);
                    console.error(error.message);
                    reject(error);
                }
            });

            // Return the stdout stream for audio
            resolve(ytDlp.stdout);
        });
    }

    /**
     * Get available audio formats for a video
     * @param {String} videoId - YouTube video ID
     * @returns {Promise<Array>} - List of available formats
     */
    async getAudioFormats(videoId) {
        await this.initialize();

        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const { stdout } = await execAsync(`${ytdlpPath} -F --no-warnings ${url}`);

        // Parse the output to extract format information
        const formats = stdout.split('\n')
            .filter(line => line.includes('audio only'))
            .map(line => {
                const match = line.match(/^(\d+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+(.*?)(?:\s+@\s+(.*))?$/);
                if (match) {
                    return {
                        id: match[1],
                        ext: match[2],
                        resolution: match[3],
                        bitrate: match[4],
                        description: match[5].trim(),
                        filesize: match[6] || 'unknown'
                    };
                }
                return null;
            })
            .filter(format => format !== null);

        return formats;
    }
}

/**
 * Singleton instance of YTDLPManager
 */
const ytdlpManager = new YTDLPManager();
export default ytdlpManager;