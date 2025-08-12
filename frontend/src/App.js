import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthScreen from "./components/AuthScreen";
import OnboardingFlow from "./components/OnboardingFlow";
import Dashboard from "./components/Dashboard";
import BodyScanner from "./components/BodyScanner";
import FaceScanner from "./components/FaceScanner";
import FoodScanner from "./components/FoodScanner";
import SocialHub from "./components/SocialHub";
import Settings from "./components/Settings";
import Profile from "./components/Profile";
import AIChat from "./components/AIChat";
import BottomNavigation from "./components/BottomNavigation";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentScreen, setCurrentScreen] = useState('main');

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = (userData) => {
    console.log("Onboarding completed with data:", userData);
    setHasCompletedOnboarding(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
    setCurrentTab('dashboard');
    setCurrentScreen('main');
  };

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <AuthScreen onLogin={handleLogin} />
        <Toaster />
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return (
      <div className="App">
        <OnboardingFlow onComplete={handleOnboardingComplete} />
        <Toaster />
      </div>
    );
  }

  const renderCurrentScreen = () => {
    switch(currentScreen) {
      case 'settings':
        return <Settings onLogout={handleLogout} onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile onBack={() => setCurrentScreen('main')} />;
      case 'ai-chat':
        return <AIChat onBack={() => setCurrentScreen('main')} />;
      case 'main':
      default:
        switch(currentTab) {
          case 'dashboard':
            return <Dashboard onNavigate={handleNavigate} />;
          case 'body-scanner':
            return <BodyScanner />;
          case 'face-scanner':
            return <FaceScanner />;
          case 'food-scanner':
            return <FoodScanner />;
          case 'social-hub':
            return <SocialHub onNavigate={handleNavigate} />;
          default:
            return <Dashboard onNavigate={handleNavigate} />;
        }
    }
  };

  return (
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
          {/* Mobile Status Bar */}
          <div className="flex justify-between items-center px-4 py-2 bg-white text-black text-sm font-medium">
            <span>15:06</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-1 h-3 bg-black rounded-full"></div>
                <div className="w-1 h-3 bg-black rounded-full opacity-60"></div>
                <div className="w-1 h-3 bg-black rounded-full opacity-30"></div>
              </div>
              <span className="ml-2">LTE</span>
              <div className="flex items-center ml-2">
                <div className="w-6 h-3 border border-black rounded-sm">
                  <div className="w-4 h-1 bg-green-500 rounded-sm ml-0.5 mt-0.5"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto pb-20">
            {renderCurrentScreen()}
          </div>

          {/* Bottom Navigation */}
          <BottomNavigation 
            currentTab={currentTab} 
            onTabChange={setCurrentTab}
            onLogout={handleLogout}
          />
        </div>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;