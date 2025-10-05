import startBot from "./bot/index.js";
import { deployCommands } from "./bot/deployCommands.js";

async function main() {
    try {
        // Get command-line arguments
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case undefined:
            case "start":
            case "run":
                await startBot();
                break;
            case "deployCommands":
                await deployCommands().catch(console.error);
                break;
            default:
                console.log(`Unknown command: ${command}`);
                console.log("Available commands: start, run, deployCommands");
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();