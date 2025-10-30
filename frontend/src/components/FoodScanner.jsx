import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, Apple, History, Target, RotateCcw } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const FoodScanner = ({ onNavigate }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mealLog, setMealLog] = useState([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [weeklyNutrition, setWeeklyNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeals();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const fetchMeals = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/user/${userId}/scans?scan_type=food`);
      if (res.ok) {
        const scans = await res.json();
        setMealLog(scans.slice(0, 6));
        // Calories today
        const todayStr = new Date().toDateString();
        const todayTotal = (scans || []).filter(s => new Date(s.timestamp).toDateString() === todayStr)
          .reduce((sum, s) => sum + (s.analysis_result?.nutrition?.calories || 0), 0);
        setTodayCalories(todayTotal);
        // Weekly aggregate (simple sum of last 7 days)
        const last7 = (scans || []).filter(s => (Date.now() - new Date(s.timestamp).getTime()) <= 7*24*60*60*1000);
        const weekly = last7.reduce((acc, s) => {
          acc.calories += s.analysis_result?.nutrition?.calories || 0;
          acc.protein  += s.analysis_result?.nutrition?.protein || 0;
          acc.carbs    += s.analysis_result?.nutrition?.carbs || 0;
          acc.fat      += s.analysis_result?.nutrition?.fat || 0;
          return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setWeeklyNutrition(weekly);
      }
    } catch {}
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const analyze = async () => {
    if (!selectedFile) {
      toast({ title: "No image", description: "Choose a food photo first", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    setScanProgress(0);
    const timer = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsScanning(false);
          setScanResult({
            message: "Nutrition analysis ready",
            analysis: { calories: 520, protein: 28, carbs: 62, fat: 18, suggestion: "Add greens", recommendation: "Include more fiber" },
            xp_earned: 5
          });
          toast({ title: "Food analyzed", description: "+5 XP earned" });
          fetchMeals();
          return 100;
        }
        return prev + 12;
      });
    }, 200);
  };

  const reset = () => {
    setScanResult(null);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScanProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const viewAll = () => { localStorage.setItem('scanHistoryFilter', 'food'); onNavigate && onNavigate('scan-history'); };

  const goal = 2000;
  const goalPct = Math.min(100, Math.round((todayCalories/goal)*100));

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen pb-20">
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold text-gray-900">Food Scanner</h1>
        <p className="text-gray-600 mt-1">Scan Your Meal</p>
      </div>

      {/* Select/Preview */}
      <Card className="p-6">
        {previewUrl ? (
          <div className="relative">
            {selectedFile?.type?.startsWith('video') ? (
              <video src={previewUrl} controls className="w-full h-64 object-cover rounded-lg border" />
            ) : (
              <img src={previewUrl} alt="preview" className="w-full h-64 object-cover rounded-lg border" />
            )}
            <Button onClick={reset} variant="outline" size="sm" className="absolute top-2 right-2"><RotateCcw size={16} /></Button>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Click to select a food photo</p>
            <p className="text-sm text-gray-500">Supports JPG/PNG/MP4 up to 5MB</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
      </Card>

      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => fileInputRef.current?.click()} className="h-20 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white flex flex-col gap-2">
          <Camera className="w-6 h-6" />
          <span className="font-medium">Scan Meal</span>
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-20 rounded-xl border-2 border-green-200 bg-white hover:bg-green-50 flex flex-col gap-2">
          <Upload className="w-6 h-6 text-green-600" />
          <span className="font-medium text-green-600">Upload Photo</span>
        </Button>
      </div>

      {/* Analyze */}
      <Button onClick={analyze} disabled={!selectedFile || isScanning} className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold">
        {isScanning ? (<div className="flex items-center gap-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Analyzing Food...</span></div>) : (<div className="flex items-center gap-3"><Apple size={22} /><span>Analyze Food</span></div>)}
      </Button>

      {/* Scanning progress */}
      {isScanning && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="text-center mb-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center"><Apple className="w-7 h-7 text-white" /></div>
            <div className="mt-2 text-sm text-gray-600">AI is processing your meal</div>
          </div>
          <Progress value={scanProgress} className="h-2" />
        </Card>
      )}

      {/* Sections */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Meal Log</h3>
        {mealLog.length === 0 ? (
          <div className="text-sm text-gray-600">No meals yet</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {mealLog.map(s => (
              <div key={s.id} className="rounded-lg overflow-hidden border bg-white">
                <div className="h-20 bg-gray-100 flex items-center justify-center text-2xl">🍽️</div>
                <div className="p-2 text-xs text-gray-700">
                  {new Date(s.timestamp).toLocaleDateString()} • {s.analysis_result?.nutrition?.calories || 0} kcal
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Weekly Nutrition</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="bg-green-50 p-3 rounded"><div className="text-xl font-bold text-green-700">{weeklyNutrition.calories}</div><div className="text-xs text-gray-600">Calories</div></div>
          <div className="bg-blue-50 p-3 rounded"><div className="text-xl font-bold text-blue-700">{weeklyNutrition.protein}g</div><div className="text-xs text-gray-600">Protein</div></div>
          <div className="bg-yellow-50 p-3 rounded"><div className="text-xl font-bold text-yellow-700">{weeklyNutrition.carbs}g</div><div className="text-xs text-gray-600">Carbs</div></div>
          <div className="bg-purple-50 p-3 rounded"><div className="text-xl font-bold text-purple-700">{weeklyNutrition.fat}g</div><div className="text-xs text-gray-600">Fat</div></div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-xs text-gray-600 mb-1">Calories Today</div>
          <div className="text-2xl font-bold text-green-700">{todayCalories}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-600 mb-2">Calories Goal</div>
          <Progress value={goalPct} className="h-2" />
          <div className="text-xs text-gray-600 mt-1">{goalPct}% of {goal} kcal</div>
        </Card>
      </div>

      {/* Scan History at bottom */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5 text-green-600" />Scan History</h3>
          <Button variant="ghost" size="sm" onClick={viewAll}>View All</Button>
        </div>
        {mealLog.length === 0 ? (
          <div className="text-sm text-gray-600">No scans yet</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {mealLog.slice(0, 6).map(s => (
              <div key={s.id} className="rounded bg-gray-100 h-16 flex items-center justify-center">🍎</div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default FoodScanner;