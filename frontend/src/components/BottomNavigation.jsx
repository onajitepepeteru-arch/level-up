import React from "react";
import { Home, Scan, User, Users, Camera, LogOut, Settings } from "lucide-react";

const BottomNavigation = ({ currentTab, onTabChange, onLogout, onNavigate }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'body-scanner', label: 'Body Scanner', icon: Scan },
    { id: 'face-scanner', label: 'Face Scanner', icon: User },
    { id: 'food-scanner', label: 'Food Scanner', icon: Camera },
    { id: 'social-hub', label: 'Social Hub', icon: Users }
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg">
      <div className="grid grid-cols-6 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} className={isActive ? 'scale-110' : ''} />
              <span className="text-xs font-medium truncate">{
                tab.id === 'body-scanner' ? 'Body' :
                tab.id === 'face-scanner' ? 'Face' :
                tab.id === 'food-scanner' ? 'Food' :
                tab.id === 'social-hub' ? 'Social' :
                tab.label.split(' ')[0]
              }</span>
            </button>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;