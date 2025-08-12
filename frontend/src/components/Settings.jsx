import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  Crown,
  Zap,
  Star
} from "lucide-react";
import { mockUser } from "../mock";

const Settings = ({ onLogout, onNavigate }) => {
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    social: true
  });

  const subscriptionPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: ["1 scan per month", "Basic AI insights", "Community access"],
      current: true
    },
    {
      name: "Starter", 
      price: "$9.99",
      period: "/month",
      features: ["10 scans per month", "Advanced AI analysis", "Progress tracking", "Priority support"],
      current: false
    },
    {
      name: "Pro",
      price: "$24.99", 
      period: "/month",
      features: ["Unlimited scans", "Personal AI coach", "Custom meal plans", "Expert consultations"],
      current: false
    },
    {
      name: "Elite",
      price: "$49.99",
      period: "/month", 
      features: ["Everything in Pro", "1-on-1 coaching calls", "Premium content", "Early access features"],
      current: false
    }
  ];

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <img 
            src={mockUser.avatar} 
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover border-4 border-blue-200"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{mockUser.name}</h3>
            <p className="text-gray-600">{mockUser.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-yellow-100 text-yellow-700">Level {mockUser.level}</Badge>
              <Badge variant="secondary">{mockUser.xp.toLocaleString()} XP</Badge>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full rounded-xl"
          onClick={() => onNavigate('profile')}
        >
          <User className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </Card>

      {/* Subscription */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
        </div>
        
        <div className="space-y-3">
          {subscriptionPlans.map((plan) => (
            <div key={plan.name} className={`p-4 rounded-xl border-2 transition-all ${
              plan.current 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  {plan.current && <Badge className="bg-blue-100 text-blue-700">Current</Badge>}
                  {plan.name === 'Elite' && <Star className="w-4 h-4 text-yellow-500" />}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-600">{plan.period}</span>
                </div>
              </div>
              
              <div className="space-y-1 mb-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              {!plan.current && (
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-600">Get notified about missions and progress</p>
            </div>
            <Switch 
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Updates</p>
              <p className="text-sm text-gray-600">Weekly progress reports and tips</p>
            </div>
            <Switch 
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Social Notifications</p>
              <p className="text-sm text-gray-600">Community updates and messages</p>
            </div>
            <Switch 
              checked={notifications.social}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, social: checked }))}
            />
          </div>
        </div>
      </Card>

      {/* Other Options */}
      <Card className="p-6">
        <div className="space-y-3">
          <Button variant="ghost" className="w-full justify-start h-12 rounded-xl hover:bg-gray-50">
            <Shield className="w-5 h-5 mr-3 text-gray-600" />
            <span>Privacy & Security</span>
          </Button>
          
          <Button variant="ghost" className="w-full justify-start h-12 rounded-xl hover:bg-gray-50">
            <HelpCircle className="w-5 h-5 mr-3 text-gray-600" />
            <span>Help & Support</span>
          </Button>
          
          <Separator />
          
          <Button 
            variant="ghost" 
            onClick={onLogout}
            className="w-full justify-start h-12 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Sign Out</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;