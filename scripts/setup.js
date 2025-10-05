import dotenv from 'dotenv';
import { decryptFile } from "../bot/utils/encrypt.js";
import fs from 'node:fs/promises';

dotenv.config();

(async () => {
    try {
        const key = process.env.SECRET_KEY;
        
        if (!key) {
            console.error('❌ Thiếu SECRET_KEY trong .env');
            process.exit(1);
        }

        // Đảm bảo các thư mục đích tồn tại
        await fs.mkdir('bin', { recursive: true });
        await fs.mkdir('bot/data', { recursive: true });

        const files = [
            {
                "in": "encrypts/yt-music.enc",
                "out": "bin/yt-music.txt"
            },
            {
                "in": "encrypts/yt.enc",
                "out": "bin/yt.txt"
            },
            {
                "in": "encrypts/data.enc",
                "out": "bot/data/data.csv"
            }
        ];

        console.log('🔓 Bắt đầu giải mã files...');

        for (const file of files) {
            console.log(`📁 Processing: ${file.in} → ${file.out}`);
            
            const result = await decryptFile(file.in, key, file.out);
            
            if (result.success) {
                console.log(`✅ ${result.message}`);
            } else {
                console.error(`❌ ${result.message}`);
            }
        }

        console.log('🎉 Hoàn thành giải mã tất cả files!');

    } catch (error) {
        console.error('❌ Lỗi trong quá trình setup:', error);
        process.exit(1);
    }
})();