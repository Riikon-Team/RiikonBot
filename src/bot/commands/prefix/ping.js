export const config = {
    name: 'ping',
    description: 'Kiểm tra độ trễ của bot',
    usage: 'ping'
  };
  
  export async function execute(message, args, client) {
    const latency = Math.round(client.ws.ping);
    await message.reply(`🏓 Pong! Độ trễ: ${latency}ms`);
  }