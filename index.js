import startBot from "./bot/index.js";

async function main() {
    try {
        await startBot();
    } catch (error) {
        console.error('Error starting bot:', error);
        process.exit(1);
    }
}

main();