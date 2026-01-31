# 🎮 Ultimate Gametime Tracker

![Static Badge](https://img.shields.io/badge/Status-Beta-orange)
![Static Badge](https://img.shields.io/badge/Stack-Electron_%7C_React_%7C_SQLite-blue)
![Static Badge](https://img.shields.io/badge/Riot_API-Compatible-cyan)

The **Ultimate Gametime Tracker** is a personal desktop application designed to provide gamers with a unified dashboard for their gaming activity across multiple platforms, including **Steam**, **World of Warcraft**, and **Riot Games**.

---

## ✨ Project Vision
Modern gaming is fragmented. Players often have their history scattered across multiple launchers and ecosystems. This project aims to synthesize that data into a single, beautiful interface, allowing for advanced personal analytics and habit tracking.

---

## 🛡️ Riot Games Integration (Technical Breakdown)
This application includes a deep integration with Riot Games to provide users with detailed insights into their League of Legends and Teamfight Tactics performance.

### API Usage & Compliance
Our implementation utilizes the following Riot Games API endpoints to build personal statistics:
- **ACCOUNT-V1**: To resolve Riot IDs and verify player identity.
- **MATCH-V5 (League of Legends)**: To retrieve match histories and calculate per-champion playtime.
- **TFT-MATCH-V1 (Teamfight Tactics)**: To aggregate match placements and trait usage over time.

### Why this project needs a Personal API Key:
- **Personal Dashboards**: Allowing individual users to visualize their own playtime split between LoL and TFT.
- **Champion Mastery Analysis**: Aggregating match data to show "Most Played Champions" with historical duration tracking.
- **Policy Compliance**: Our implementation follows all Riot Developer Policies:
    - **Local Storage**: All API keys and fetched match data are stored strictly on the user's local machine using encrypted `electron-store` and local SQLite databases.
    - **No Aggregated Public Data**: The app is for personal use only; it does not host or expose other players' data.
    - **Respectful Rate Limiting**: Built-in handling for 429 responses and exponential backoff.

---

## 🏛️ Key Features

### 🏯 Universal Dashboard
- **Habit Tracking**: Visualizing playtime peaks throughout the week.
- **Platform Analytics**: Dynamic Recharts-based distribution of time across all engines.

### ⚔️ World of Warcraft Integration
- **Custom Addon**: Interacts with a local bridge to track `/played` across Retail, Classic, and Anniversary editions.
- **Character Management**: Aggregates data across an entire account's characters.

### ☁️ Platform Bridges
- **Vite & Electron Powered**: Blazing fast performance with a modern frontend.
- **Platform Icons**: Sleek glassmorphism UI using Lucide-React icons.

---

## ⚙️ Setup & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (Directly compatible with LTS)
- Latest Stable Python (for local bridge components)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Petlus/UltimateGametimeTracker.git
   ```

2. **Initialize Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Tailwind CSS, Recharts.
- **Backend / OS Layer**: Electron 30, Better-SQLite3, Node.js.
- **Design System**: Custom **Cosmic Glassmorphism** implementation.

---

*Developed with ❤️ for the global gaming community. Not affiliated with Riot Games, Blizzard, or Valve.*
