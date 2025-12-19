import { startAttendAction } from '../actions/attend/startAttend.js';
import { endAttendAction } from '../actions/attend/endAttend.js';

export const StartAttendPrefixCommand = {
    data: {
        name: 'startattend',
        description: 'Bắt đầu phiên điểm danh',
        cooldown: 5000,
        usage: 'startattend <thời gian (giây)> <tiêu đề> [câu hỏi] [câu trả lời]',
        aliases: ['sa']
    },
    async execute(ctx, args) {
        if (args.length < 2) {
            return ctx.reply('Cú pháp: `startattend <thời gian> <tiêu đề> [câu hỏi] [câu trả lời]`');
        }

        const duration = parseInt(args[0]);
        if (isNaN(duration)) {
            return ctx.reply('Thời gian phải là số nguyên (đơn vị: giây)!');
        }

        const title = args[1];
        const question = args[2] || null;
        const answer = args[3] || null;

        return await startAttendAction(ctx, { duration, title, question, answer });
    }
};

export const EndAttendPrefixCommand = {
    data: {
        name: 'endattend',
        description: 'Kết thúc phiên điểm danh của bạn',
        cooldown: 3000,
        usage: 'endattend',
        aliases: ['ea']
    },
    async execute(ctx, args) {
        return await endAttendAction(ctx);
    }
};

export default [
    StartAttendPrefixCommand,
    EndAttendPrefixCommand
];
