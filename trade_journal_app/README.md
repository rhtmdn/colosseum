# Trade Journal App (Colosseum)

A comprehensive, modern React web application for traders to log, analyze, and review their trading performance across multiple portfolios.

## Features

- **Portfolio Management:** Create, manage, and switch between different trading portfolios, each with an initial balance and distinct color-coding.
- **Trade Logging:** Manually add trades or import them in bulk via CSV. Track essential metrics like instrument, asset class, side, entry/exit prices, quantity, dates, strategies, setups, PnL, fees, stop loss, take profit, R-multiple, and tags.
- **Comprehensive Analytics:** Detailed dashboard featuring portfolio statistics (win rate, profit factor, average win/loss, max drawdown, Sharpe ratio) and equity curve charts using Recharts.
- **Calendar View:** Visualize trading days, daily PnL, wins/losses, and volume directly on a calendar interface.
- **Filtering & Search:** Easily filter trades by date, instrument, strategy, side, asset class, status, and custom tags.
- **Daily Journaling:** Keep notes on pre-market preparation, post-market reflections, mood, lessons learned, and mistakes.
- **Cloud Sync:** Uses Firebase Firestore for real-time data persistence and synchronization across devices.

## Tech Stack

- **Frontend Framework:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS 4
- **Routing:** React Router DOM (HashRouter)
- **Data Visualization:** Recharts
- **Date Handling:** date-fns
- **Icons:** Lucide React
- **Backend & Database:** Firebase Firestore

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd trade_journal_app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will typically be available at `http://localhost:5173`.

### Firebase Configuration

The application is pre-configured to use a specific Firebase project (`colosseum-a7f03`). To use your own Firebase database:
1. Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Firestore Database.
3. Update the `firebaseConfig` object in `src/config/firebase.ts` with your project's credentials.

## Scripts

- `npm run dev` - Starts the Vite development server.
- `npm run build` - Type-checks the application and builds for production.
- `npm run preview` - Locally previews the production build.
- `npm run lint` - Runs ESLint to check for code quality issues.
- `npm run deploy` - Deploys the built app to GitHub Pages using `gh-pages`.

## License

This project is private and intended for internal use.
