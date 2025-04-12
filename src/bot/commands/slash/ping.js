export const config = {
    name: 'ping',
    description: 'Kiểm tra độ trễ của bot'
  };
  
  export async function execute(interaction, client) {
    const latency = Math.round(client.ws.ping);
    await interaction.reply(`🏓 Pong! Độ trễ: ${latency}ms`);
  }