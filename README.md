# 🎮 Ultimate Gametime Tracker

![Static Badge](https://img.shields.io/badge/Status-Beta-orange)
![Static Badge](https://img.shields.io/badge/Stack-Electron_%7C_React_%7C_SQLite-blue)
![Static Badge](https://img.shields.io/badge/Riot_API-v5-cyan)

The **Ultimate Gametime Tracker** is a premium desktop application designed for power gamers who want to aggregate their playtime across all major platforms. Built with a modern **Cosmic Glassmorphism** aesthetic, it offers deep integration with Steam, Riot Games, and World of Warcraft.

---

## ✨ Key Features

### 🏛️ Unified Dashboard
*   **Total Playtime Overview**: See your gaming habits at a glance.
*   **Platform Breakdown**: Visual charts showing your split between Steam, Riot, and manual games.
*   **Most Played**: Automatically updated list of your top titles.

### ⚔️ World of Warcraft Bridge
*   **Addon Integration**: A custom-built WoW Addon that tracks `/played` across all characters.
*   **Cross-Version Support**: Works with Retail, Classic, and Anniversary editions.
*   **Auto-Sync**: Synchronizes your data whenever you reload the UI or exit the game.

### 🛡️ Riot Games Integration (LoL & TFT)
*   **Match History**: Automatically fetches your recent League of Legends and TFT matches.
*   **Champion Stats**: Visualizes your mastery and playtime with specific champions.
*   **Data Dragon Powered**: High-quality splash art pulled directly from Riot's CDN.

### ☁️ Platform Bridges
*   **Steam**: Auto-syncs your Steam library and playtimes via API.
*   **GOG Galaxy 2.0 Bridge**: Optional support for EA App, Ubisoft Connect, and more.
*   **Manual Tracking**: Add any `.exe` to track local games or custom launchers.

---

## 🎨 Aesthetic
The application features a **Cosmic Glassmorphism** design:
- Vibrant gradients and subtle blur effects.
- Dynamic Recharts visualizations.
- Smooth micro-animations for a premium feel.

---

## ⚙️ Setup & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the Repo**
   ```bash
   git clone https://github.com/Petlus/UltimateGametimeTracker.git
   cd UltimateGametimeTracker
   ```

2. **Install Dependencies**
   ```bash
   cd desktop
   npm install
   ```

3. **Run in Development**
   ```bash
   npm run dev
   ```

4. **Build the App**
   ```bash
   npm run build
   ```

---

## 🔒 Security
Your data is yours.
- **Riot API Keys** are stored locally using `electron-store`.
- **Match Data** is kept in a private SQLite database on your machine.
- No third-party servers tracking your data.

---

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Electron, Better-SQLite3, Node.js.
- **APIs**: Steam Web API, Riot Match-v5 API.

---

## 📝 Troubleshooting (Riot Integration)
If you encounter a **Forbidden (403)** error:
1. Riot Development Keys expire every **24 hours**.
2. Regenerate your key at the [Riot Developer Portal](https://developer.riotgames.com/).
3. Update the key in the App Settings.

---

*Developed with ❤️ for the gaming community.*
