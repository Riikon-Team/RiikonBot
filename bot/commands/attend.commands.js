import { SlashCommandBuilder } from 'discord.js';
import { startAttendAction } from '../actions/attend/startAttend.js';
import { endAttendAction } from '../actions/attend/endAttend.js';

export const StartAttendCommand = {
    data: new SlashCommandBuilder()
        .setName('startattend')
        .setDescription('Bắt đầu phiên điểm danh')
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Thời gian điểm danh (giây, tối đa 43200 - 12 giờ)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(43200))
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Tiêu đề điểm danh')
                .setRequired(true)
                .setMaxLength(256))
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Câu hỏi xác minh (tùy chọn)')
                .setRequired(false)
                .setMaxLength(512))
        .addStringOption(option =>
            option.setName('answer')
                .setDescription('Câu trả lời cho câu hỏi xác minh')
                .setRequired(false)
                .setMaxLength(512)),

    cooldown: 5000,

    async execute(ctx) {
        const duration = ctx.getOption('duration', 'integer');
        const title = ctx.getOption('title');
        const question = ctx.getOption('question');
        const answer = ctx.getOption('answer');

        return await startAttendAction(ctx, { duration, title, question, answer });
    }
};

export const EndAttendCommand = {
    data: new SlashCommandBuilder()
        .setName('endattend')
        .setDescription('Kết thúc phiên điểm danh của bạn'),

    cooldown: 3000,

    async execute(ctx) {
        return await endAttendAction(ctx);
    }
};

export default [
    StartAttendCommand,
    EndAttendCommand
];
