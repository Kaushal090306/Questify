import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuizProvider } from './contexts/QuizContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BrutalistNavbar } from './components/layout/BrutalistNavbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import BrutalistDemoContent from './components/ui/BrutalistDemoContent';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import GeneratePage from './pages/GeneratePage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CreateRoom from './pages/CreateRoom';
import JoinRoomPage from './pages/JoinRoomPage';
import RoomLobbyPage from './pages/RoomLobbyPage';
import RoomPage from './pages/RoomPage';
import MultiplayerQuizPage from './pages/MultiplayerQuizPage';
import RoomResultsPage from './pages/RoomResultsPage';
import DailyPracticePage from './pages/DailyPracticePage';
import GenerateQuiz from './pages/GenerateQuiz';
import RecentQuizzesPage from './pages/RecentQuizzesPage';
import AttemptDetailPage from './pages/AttemptDetailPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <QuizProvider>
          <WebSocketProvider>
            <div className="min-h-screen w-full bg-white relative flex flex-col">
              {/* Grid Background */}
              <div
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative z-10 flex flex-col min-h-screen">
                <BrutalistNavbar />
                <main className="flex-1 pt-12">{/* Reduced padding-top for smaller navbar */}
                  <Routes>
                    <Route path="/" element={<BrutalistDemoContent />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/generate" element={
                      <ProtectedRoute>
                        <GeneratePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/generate-quiz" element={
                      <ProtectedRoute>
                        <GenerateQuiz />
                      </ProtectedRoute>
                    } />
                    <Route path="/quiz/:quizId" element={
                      <ProtectedRoute>
                        <QuizPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/results/:quizId" element={
                      <ProtectedRoute>
                        <ResultsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/analytics" element={
                      <ProtectedRoute>
                        <AnalyticsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/recent-quizzes" element={
                      <ProtectedRoute>
                        <RecentQuizzesPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/attempts/:attemptId" element={
                      <ProtectedRoute>
                        <AttemptDetailPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/create-room" element={
                      <ProtectedRoute>
                        <CreateRoom />
                      </ProtectedRoute>
                    } />
                    <Route path="/join-room" element={
                      <ProtectedRoute>
                        <JoinRoomPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/room/:roomCode/lobby/host" element={
                      <ProtectedRoute>
                        <RoomLobbyPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/room/:roomCode/lobby/participant" element={
                      <ProtectedRoute>
                        <RoomLobbyPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/room/:roomCode/lobby" element={
                      <ProtectedRoute>
                        <RoomLobbyPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/room/:roomCode" element={
                      <ProtectedRoute>
                        <RoomPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/room/:roomCode/quiz" element={
                      <ProtectedRoute>
                        <MultiplayerQuizPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/multiplayer/:roomId" element={
                      <ProtectedRoute>
                        <MultiplayerQuizPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/room/:roomId/results" element={
                      <ProtectedRoute>
                        <RoomResultsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/daily-practice" element={
                      <ProtectedRoute>
                        <DailyPracticePage />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </main>
                <Footer />
              </div>
            </div>
            <ToastContainer />
          </WebSocketProvider>
        </QuizProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
