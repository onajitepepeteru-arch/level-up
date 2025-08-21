import React, { useState, useEffect } from "react";
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
import ActivityCalendar from "./components/ActivityCalendar";
import NotificationsScreen from "./components/NotificationsScreen";
import BottomNavigation from "./components/BottomNavigation";
import { Toaster } from "./components/ui/toaster";
import ScanHistory from "./components/ScanHistory";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentScreen, setCurrentScreen] = useState('main');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('user');
    const userId = localStorage.getItem('userId');
    
    if (storedUser && userId) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setIsAuthenticated(true);
        setHasCompletedOnboarding(user.onboarding_completed || false);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
      }
    }
  };

  const handleLogin = (isExistingUser = true) => {
    setIsAuthenticated(true);
    if (isExistingUser) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setHasCompletedOnboarding(user.onboarding_completed || true);
        } catch (error) {
          setHasCompletedOnboarding(true);
        }
      } else {
        setHasCompletedOnboarding(true);
      }
    }
  };

  const handleOnboardingComplete = (onboardingData) => {
    console.log("Onboarding completed with data:", onboardingData);
    setHasCompletedOnboarding(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const updatedUser = { ...user, onboarding_completed: true, ...onboardingData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserData(updatedUser);
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
    setCurrentTab('dashboard');
    setCurrentScreen('main');
    setUserData(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
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
      case 'activity':
        return <ActivityCalendar onBack={() => setCurrentScreen('main')} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => setCurrentScreen('main')} />;
      case 'scan-history':
        return <ScanHistory onBack={() => setCurrentScreen('main')} />;
      case 'main':
      default:
        switch(currentTab) {
          case 'dashboard':
            return <Dashboard onNavigate={handleNavigate} />;
          case 'body-scanner':
            return <BodyScanner onNavigate={handleNavigate} />;
          case 'face-scanner':
            return <FaceScanner onNavigate={handleNavigate} />;
          case 'food-scanner':
            return <FoodScanner onNavigate={handleNavigate} />;
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
          <div className="flex justify-between items-center px-4 py-2 bg-white text-black text-sm font-medium">
            <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
          <div className="flex-1 overflow-y-auto pb-20">{renderCurrentScreen()}</div>
          {currentScreen === 'main' && (
            <BottomNavigation 
              currentTab={currentTab} 
              onTabChange={setCurrentTab}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
            />
          )}
        </div>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;