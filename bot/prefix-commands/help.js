import { helpAction } from '../actions/system.js';

export default {
    data: {
        name: 'help',
        description: 'Hiện thị danh sách lệnh có thể sử dụng',
        cooldown: 1000,
    },
    async execute(message, args) {
        const type = args.length > 0 ? args[0].toLowerCase() : 'prefix';
        if (type !== 'prefix' && type !== 'slash') {
            await message.reply('Loại lệnh không hợp lệ. Vui lòng sử dụng "prefix" hoặc "slash".');
            return;
        }
        const page = args.length > 1 ? parseInt(args[1]) : 1;
        if (isNaN(page) || page < 1) {
            await message.reply('Vui lòng cung cấp số trang hợp lệ.');
            return;
        }
        const reply = helpAction(this.data.name, message.client.helpDocs, type, page);
        await message.reply(reply);
    }
};
