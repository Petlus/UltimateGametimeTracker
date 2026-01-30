import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';

import { Games } from './pages/Games';
import { Stats } from './pages/Stats';
import { WoW } from './pages/WoW';
import League from './pages/League';

import { TitleBar } from './components/TitleBar';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden pt-14">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 h-full overflow-y-auto custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/games" element={<Games />} />
              <Route path="/wow" element={<WoW />} />
              <Route path="/league" element={<League />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
