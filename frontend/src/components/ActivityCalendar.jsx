import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, TrendingUp, Target } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const ActivityCalendar = ({ onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activityData, setActivityData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [userScans, setUserScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadActivityData();
  }, [currentDate]);

  const loadActivityData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/user/${userId}/scans`);
      
      if (response.ok) {
        const scans = await response.json();
        setUserScans(scans);
        
        // Group scans by date
        const groupedData = {};
        scans.forEach(scan => {
          const date = new Date(scan.timestamp).toDateString();
          if (!groupedData[date]) {
            groupedData[date] = [];
          }
          groupedData[date].push(scan);
        });
        
        setActivityData(groupedData);
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      toast({
        title: "Error",
        description: "Failed to load activity data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getActivityForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    return activityData[dateStr] || [];
  };

  const getActivityLevel = (activities) => {
    if (activities.length === 0) return 'none';
    if (activities.length === 1) return 'low';
    if (activities.length === 2) return 'medium';
    return 'high';
  };

  const getActivityColor = (level) => {
    switch (level) {
      case 'none': return 'bg-gray-100';
      case 'low': return 'bg-green-200';
      case 'medium': return 'bg-green-400';
      case 'high': return 'bg-green-600';
      default: return 'bg-gray-100';
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTotalStats = () => {
    const total = userScans.length;
    const thisMonth = userScans.filter(scan => {
      const scanDate = new Date(scan.timestamp);
      return scanDate.getMonth() === currentDate.getMonth() && 
             scanDate.getFullYear() === currentDate.getFullYear();
    }).length;
    
    const scanTypes = userScans.reduce((acc, scan) => {
      acc[scan.scan_type] = (acc[scan.scan_type] || 0) + 1;
      return acc;
    }, {});

    return { total, thisMonth, scanTypes };
  };

  const days = getDaysInMonth(currentDate);
  const stats = getTotalStats();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Activity Calendar</h1>
              <p className="text-sm text-gray-600">Track your fitness journey</p>
            </div>
          </div>
          <Calendar size={24} className="text-purple-600" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Scans</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonth}</div>
            <div className="text-xs text-gray-600">This Month</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{Object.keys(stats.scanTypes).length}</div>
            <div className="text-xs text-gray-600">Scan Types</div>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
              <ChevronLeft size={20} />
            </Button>
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
              <ChevronRight size={20} />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="aspect-square"></div>;
              }

              const activities = getActivityForDate(day);
              const level = getActivityLevel(activities);
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-sm
                    ${isSelected ? 'border-purple-500 shadow-lg' : 'border-gray-200'}
                    ${isToday ? 'ring-2 ring-purple-300' : ''}
                    ${getActivityColor(level)} hover:shadow-md
                  `}
                >
                  <span className={`font-medium ${level === 'none' ? 'text-gray-600' : 'text-white'}`}>
                    {day.getDate()}
                  </span>
                  {activities.length > 0 && (
                    <div className={`text-xs ${level === 'none' ? 'text-gray-400' : 'text-white/80'}`}>
                      {activities.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Activity Legend */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Activity Level</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-100"></div>
              <span>None</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-200"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-400"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-600"></div>
              <span>High</span>
            </div>
          </div>
        </Card>

        {/* Selected Date Details */}
        {selectedDate && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{formatDate(selectedDate)}</h3>
            
            {getActivityForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getActivityForDate(selectedDate).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {activity.scan_type === 'food' ? '🍎' : 
                         activity.scan_type === 'body' ? '💪' : '✨'}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{activity.scan_type} Scan</div>
                        <div className="text-sm text-gray-600">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default">+{activity.xp_earned} XP</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target size={48} className="mx-auto mb-3 opacity-50" />
                <p>No activity on this date</p>
                <p className="text-sm">Start your fitness journey today!</p>
              </div>
            )}
          </Card>
        )}

        {/* Scan Type Breakdown */}
        {Object.keys(stats.scanTypes).length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Scan Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(stats.scanTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {type === 'food' ? '🍎' : type === 'body' ? '💪' : '✨'}
                    </span>
                    <span className="font-medium capitalize">{type} Scans</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActivityCalendar;