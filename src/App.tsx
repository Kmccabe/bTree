import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AlgorandProvider } from './contexts/AlgorandContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import ExperimentCreator from './pages/ExperimentCreator';
import ExperimentSession from './pages/ExperimentSession';
import Analytics from './pages/Analytics';
import ParticipantView from './pages/ParticipantView';
import TrustGameSession from './pages/TrustGameSession';
import TrustGameLobby from './pages/TrustGameLobby';

function App() {
  return (
    <AlgorandProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
          <Navbar />
          <main className="pt-16 flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-experiment" element={<ExperimentCreator />} />
              <Route path="/experiment/:id" element={<ExperimentSession />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/participate/:experimentId" element={<ParticipantView />} />
              <Route path="/trust-game/:experimentId" element={<TrustGameSession />} />
              <Route path="/trust-game-lobby/:experimentId" element={<TrustGameLobby />} />
            </Routes>
          </main>
          <Footer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                borderRadius: '8px',
              },
            }}
          />
        </div>
      </Router>
    </AlgorandProvider>
  );
}

export default App;