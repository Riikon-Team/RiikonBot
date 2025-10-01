import { PREFIX } from "../constants/bot.js";

export const genarateHelpDoc = (commands, prefixCommands) => {
    let helpMessage = 'Đây là danh sách các lệnh có thể sử dụng:\n\n';

    return {
        content: helpMessage,
        prefixCommands: {
            title: 'Lệnh với prefix',
            prefix: PREFIX,
            commands: [...prefixCommands.values()].map(cmd => ({
                name: cmd.data.name,
                description: cmd.data.description || 'Không có mô tả'
            }))
        },
        commands: {
            title: 'Lệnh Slash',
            prefix: '/',
            commands: [...commands.values()].map(cmd => ({
                name: cmd.data.name,
                description: cmd.data.description || 'Không có mô tả'
            }))
        }
    }
}