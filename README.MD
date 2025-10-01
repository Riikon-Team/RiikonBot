# 📦 RiikonBot

![Version](https://img.shields.io/github/package-json/v/Riikon-Team/RiikonBot?style=for-the-badge)
![License](https://img.shields.io/github/license/Riikon-Team/RiikonBot?style=for-the-badge)
![Top language](https://img.shields.io/github/languages/top/Riikon-Team/RiikonBot?style=for-the-badge)
![Discord](https://img.shields.io/discord/994243227764936744?style=for-the-badge&logo=discord&logoColor=white)

## 📖 Giới thiệu

**RiikonBot** là một Discord bot thông minh được phát triển bởi Riikon Team, tích hợp AI Gemini 2.5 để trò chuyện tự nhiên và cung cấp nhiều tính năng quản lý server, thông tin game, và các tiện ích hữu ích khác.

### ✨ Tính năng chính

- 🤖 **AI Agent**: Trò chuyện thông minh với Gemini 2.5, nhập vai The Herta. Có khả năng hiểu và thực hiện hành động logic như bot discord. Còn như nào tự tìm hiểu đi ehehe
- 🎮 **Game Tools**: Lấy gift codes cho các game Hoyoverse (Genshin Impact, Honkai: Star Rail, ZZZ...)
- 🔧 **Voice Channel Management**: Chỉnh sửa kênh voice (region, bitrate, user limit, tên, topic)
- 📊 **Server & User Info**: Thông tin chi tiết về server, user, presence status
- 🎨 **Avatar & Profile**: Xem avatar, profile người dùng
- ⚡ **Prefix & Slash Commands**: Hỗ trợ cả hai loại lệnh
- 📝 **Smart Message Splitting**: Tách tin nhắn dài một cách thông minh

## 📂 Cấu trúc

```
RiikonBot/
├── bot/
│   ├── actions/           # Logic xử lý các tính năng
│   │   ├── chat-ai/       # Xử lý AI chat với Gemini
│   │   ├── game-topics.js # Actions cho game-related features
│   │   └── system.js      # Actions cho system commands
│   ├── commands/          # Slash commands
│   ├── prefix-commands/   # Prefix commands
│   ├── events/           # Discord event handlers
│   ├── functions/        # Function definitions cho AI
│   │   ├── game-topics.js # Game-related functions
│   │   └── system.js     # System functions
│   ├── constants/        # Các hằng số và cấu hình
│   ├── utils/           # Tiện ích helper
│   └── index.js         # Bot initialization
├── .github/             # GitHub templates & workflows
├── package.json
├── .env.example
└── README.md
```

## 🛠️ Cài đặt

### Yêu cầu hệ thống
- Node.js 18.0.0+
- npm hoặc yarn
- MongoDB (cho database)

### Cài đặt dependencies
```bash
# Clone repository
git clone https://github.com/Riikon-Team/RiikonBot.git
cd RiikonBot

# Cài đặt packages
npm install
```

### Cấu hình environment
1. Tạo file .env từ .env.example:
```bash
cp .env.example .env
```

2. Điền các thông tin cần thiết:
```env
# Bot Configuration
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret
DISCORD_CLIENT_PUBLIC_KEY=your-client-public-key

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/riikonbot

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

PREFIX="rii"
```

### Thiết lập Discord Bot
1. Tạo application tại [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo bot và lấy token
3. Bật **Privileged Gateway Intents**:
   - ✅ **SERVER MEMBERS INTENT**
   - ✅ **PRESENCE INTENT**
4. Invite bot vào server với quyền Administrator

## 🚀 Triển khai

### Development
```bash
# Chạy với nodemon (auto-restart)
npm run dev

# Hoặc chạy thường
npm start
```

### Production
```bash
# Chạy production
node index.js
```

## 📋 Sử dụng
### Prefix Commands
Sử dụng prefix `rii` (mặc định) hoặc tùy chỉnh trong .env
```plaintext
rii help
```

### Slash Commands
Sử dụng lệnh dạng `/command` trong Discord
/ (gõ / trong chat để xem danh sách lệnh)

### AI Function Calling
Bot có thể tự động gọi các functions khi chat:
- `GiftcodeHoyoverseGame`: Lấy gift codes game
- `EditVoiceChannel`: Chỉnh sửa kênh voice
- `UserInfo`: Thông tin user
- `UserPresence`: Trạng thái online/activities
- `GuildInfo`: Thông tin server
- ... Và nhiều hơn nữa

## 🎮 Game Support

Bot hỗ trợ lấy gift codes cho các game Hoyoverse:
- **Honkai: Star Rail** (`hkrpg`)
- **Genshin Impact** (`genshin`) 
- **Honkai Impact 3rd** (`honkai3rd`)
- **Zenless Zone Zero** (`nap`)
- **Tears of Themis** (`tot`)

## Các nguồn sử dụng

- [Discord.js](https://discord.js.org/#/)
- [Gemini API](https://developers.generativeai.google/products/gemini)
- [seriaati/hoyo-codes](https://github.com/seriaati/hoyo-codes)

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng! 

### Cách đóng góp:
1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

### Issue Templates
- 🐛 **Bug Report**: Báo cáo lỗi
- 🚀 **Feature Request**: Đề xuất tính năng mới
- 📚 **Documentation**: Cải thiện documentation

## 📞 Hỗ trợ

- 💬 **Discord Server**: [Join our community](https://discord.gg/6wqDQc9c4g)
- 📋 **Issues**: [GitHub Issues](https://github.com/Riikon-Team/RiikonBot/issues)
- 📖 **Documentation**: [Wiki](https://github.com/Riikon-Team/RiikonBot/wiki)

## 📊 Stats & Badges

![GitHub issues](https://img.shields.io/github/issues/Riikon-Team/RiikonBot?style=flat-square)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Riikon-Team/RiikonBot?style=flat-square)
![GitHub contributors](https://img.shields.io/github/contributors/Riikon-Team/RiikonBot?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/Riikon-Team/RiikonBot?style=flat-square)

## 📝 Giấy phép

Dự án này được cấp phép theo **Apache License 2.0**. Xem file LICENSE để biết thêm chi tiết.

---

<div align="center">
  <strong>Được phát triển với ❤️ bởi Riikon Team</strong><br>
</div>