import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, Utensils, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockFoodLog, mockNutrition } from "../mock";

const FoodScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  const handleScanMeal = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          toast({
            title: "Food Analysis Complete!",
            description: "Nutritional breakdown is ready. +5 XP earned!"
          });
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  const handleUploadPhoto = () => {
    toast({
      title: "Upload Feature",
      description: "Food photo upload will be implemented with backend integration!"
    });
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Food Scanner</h1>
        <p className="text-gray-600 mt-1">Scan Your Meal</p>
        <p className="text-sm text-gray-500 mt-2">
          Snap or upload a food photo for instant analysis.
        </p>
      </div>

      {/* Scan Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleScanMeal}
          disabled={isScanning}
          className="h-20 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex flex-col items-center gap-2 transition-all duration-200 transform hover:scale-[1.02]"
        >
          <Camera className="w-6 h-6" />
          <span className="font-medium">{isScanning ? 'Analyzing...' : 'Scan Meal'}</span>
        </Button>

        <Button
          onClick={handleUploadPhoto}
          variant="outline"
          className="h-20 rounded-xl border-2 border-green-200 hover:border-green-300 bg-white hover:bg-green-50 flex flex-col items-center gap-2 transition-all duration-200"
        >
          <Upload className="w-6 h-6 text-green-600" />
          <span className="font-medium text-green-600">Upload Photo</span>
        </Button>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
              <Utensils className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="font-semibold text-gray-900">Analyzing Your Meal...</h3>
            <p className="text-sm text-gray-600">AI is identifying nutrients</p>
          </div>
          <Progress value={scanProgress} className="h-3" />
          <p className="text-center text-sm text-gray-500 mt-2">{scanProgress}% Complete</p>
        </Card>
      )}

      {/* Recent Meal Analysis */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Utensils className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Upload Meal Photo</h3>
            <p className="text-sm text-gray-600">Analyze calories & nutrients</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg text-center">
            <p className="text-lg font-bold text-green-600">850</p>
            <p className="text-xs text-gray-600">Calories Today</p>
          </div>
          <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg text-center">
            <p className="text-lg font-bold text-blue-600">85%</p>
            <p className="text-xs text-gray-600">Nutrition Goal</p>
          </div>
        </div>
      </Card>

      {/* Meal Log */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Meal Log</h3>
          <Button variant="ghost" size="sm" className="text-blue-600">See All</Button>
        </div>
        
        <div className="space-y-3">
          {mockFoodLog.map((food) => (
            <div key={food.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <img 
                src={food.image} 
                alt={food.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{food.name}</p>
                <p className="text-sm text-gray-600">{food.calories} kcal</p>
              </div>
              <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700">
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Nutrition */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Weekly Nutrition
          </h3>
          <Button variant="ghost" size="sm" className="text-blue-600">Summary</Button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Calories (weekly)</span>
              <span className="font-medium text-gray-900">{mockNutrition.weekly.calories}</span>
            </div>
            <Progress value={103} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Protein (g)</span>
              <span className="font-medium text-gray-900">{mockNutrition.weekly.protein}</span>
            </div>
            <Progress value={90} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Carbs (g)</span>
              <span className="font-medium text-gray-900">{mockNutrition.weekly.carbs}</span>
            </div>
            <Progress value={90} className="h-2" />
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Food Tracking</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <p className="text-2xl font-bold text-orange-600">7</p>
            <p className="text-sm text-gray-600">Day Streak</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">94%</p>
            <p className="text-sm text-gray-600">Accuracy</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FoodScanner;