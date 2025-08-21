import React from "react";
import { Button } from "./ui/button";
import { Home, Scan, User, MessageCircle, Settings } from "lucide-react";

const BottomNavigation = ({ currentTab, onTabChange, onNavigate }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'body-scanner', label: 'Body', icon: Scan },
    { id: 'face-scanner', label: 'Face', icon: User },
    { id: 'food-scanner', label: 'Food', icon: Scan },
    { id: 'social-hub', label: 'Social', icon: MessageCircle },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 h-auto min-w-0 ${
                  isActive 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{tab.label}</span>
              </Button>
            );
          })}
          
          {/* Settings Button */}
          <Button
            variant="ghost"
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center gap-1 px-3 py-2 h-auto min-w-0 text-gray-600 hover:text-purple-600"
          >
            <Settings size={20} />
            <span className="text-xs font-medium">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;