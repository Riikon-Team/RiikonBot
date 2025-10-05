import dotenv from 'dotenv';
import { encryptFile } from "../bot/utils/encrypt.js";
import fs from 'node:fs/promises';

dotenv.config();

(async () => {
    try {
        const key = process.env.SECRET_KEY;
        
        if (!key) {
            console.error('❌ Thiếu SECRET_KEY trong .env');
            process.exit(1);
        }

        // Đảm bảo thư mục encrypts tồn tại
        await fs.mkdir('encrypts', { recursive: true });

        const files = [
            {
                "in": "bin/yt-music.txt",
                "out": "encrypts/yt-music.enc"
            },
            {
                "in": "bin/yt.txt",
                "out": "encrypts/yt.enc"
            },
            {
                "in": "bot/data/data.csv",
                "out": "encrypts/data.enc"
            }
        ];

        console.log('🔐 Bắt đầu mã hóa files...');

        for (const file of files) {
            console.log(`📁 Processing: ${file.in} → ${file.out}`);
            
            const result = await encryptFile(file.in, key, file.out);
            
            if (result.success) {
                console.log(`✅ ${result.message}`);
            } else {
                console.error(`❌ ${result.message}`);
            }
        }

        console.log('🎉 Hoàn thành mã hóa tất cả files!');

    } catch (error) {
        console.error('❌ Lỗi trong quá trình pack:', error);
        process.exit(1);
    }
})();