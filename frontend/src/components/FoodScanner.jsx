import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, Apple, History, Target, CheckCircle, RotateCcw } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockNutritionAnalysis, mockScanHistory } from "../mock";

const FoodScanner = ({ onNavigate }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [todayCalories, setTodayCalories] = useState(0);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/user/${userId}/scans?scan_type=food`);
        if (res.ok) {
          const data = await res.json();
          const today = new Date().toDateString();
          const total = (data || []).filter(s => new Date(s.timestamp).toDateString() === today)
            .reduce((sum, s) => sum + (s.analysis_result?.nutrition?.calories || 0), 0);
          setTodayCalories(total);
        }
      } catch {}
    };
    fetchToday();
  }, []);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast({ title: "Error", description: "Image size must be less than 5MB", variant: "destructive" }); return; }
      if (!file.type.startsWith('image/')) { toast({ title: "Error", description: "Please select a valid image file", variant: "destructive" }); return; }
      setSelectedImage(file);
      const reader = new FileReader(); reader.onload = (e) => setImagePreview(e.target.result); reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) { toast({ title: "No Image Selected", description: "Please select a food image to scan first", variant: "destructive" }); return; }
    setIsScanning(true); setScanProgress(0);
    const interval = setInterval(() => { setScanProgress(prev => { if (prev >= 100) { clearInterval(interval); setIsScanning(false); setScanResult({ message: "Food scan completed successfully!", analysis: mockNutritionAnalysis, xp_earned: 5 }); toast({ title: "Nutrition Analysis Complete!", description: "+5 XP earned!" }); return 100; } return prev + 15; }); }, 200);
  };

  const handleFoodPhoto = () => fileInputRef.current?.click();
  const handleUploadPhoto = () => fileInputRef.current?.click();

  const resetScan = () => { setScanResult(null); setSelectedImage(null); setImagePreview(null); setScanProgress(0); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const viewAll = () => { localStorage.setItem('scanHistoryFilter', 'food'); onNavigate && onNavigate('scan-history'); };
  const viewSuggestion = () => { onNavigate && onNavigate('ai-chat'); };

  const nutritionGoal = 2000;
  const nutritionPercent = Math.min(100, Math.round((todayCalories / nutritionGoal) * 100));

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen pb-20">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Food Scanner</h1>
        <p className="text-gray-600 mt-1">Scan Your Meal</p>
        <p className="text-sm text-gray-500 mt-2">Snap or upload a food photo for instant analysis.</p>
      </div>

      {!scanResult ? (
        <>
          {imagePreview ? (
            <Card className="p-6">
              <div className="relative">
                <img src={imagePreview} alt="Selected food photo" className="w-full h-64 object-cover rounded-lg border-2 border-gray-200" />
                <Button onClick={resetScan} variant="outline" size="sm" className="absolute top-2 right-2"><RotateCcw size={16} /></Button>
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">Food photo selected. Ready to analyze nutrition!</p>
            </Card>
          ) : (
            <Card className="p-6">
              <div onClick={handleUploadPhoto} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">Click to select a food photo</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG up to 5MB</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleFoodPhoto} disabled={isScanning} className="h-20 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex flex-col items-center gap-2">
              <Camera className="w-6 h-6" />
              <span className="font-medium">Scan Meal</span>
            </Button>
            <Button onClick={handleUploadPhoto} variant="outline" className="h-20 rounded-xl border-2 border-green-200 hover:border-green-300 bg-white hover:bg-green-50 flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-green-600" />
              <span className="font-medium text-green-600">Upload Photo</span>
            </Button>
          </div>

          {/* Quick Stats card to mimic earlier design */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-600">Calories Today</div>
                <div className="text-2xl font-bold text-green-700">{todayCalories}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-600">Nutrition Goal</div>
                <div className="text-2xl font-bold text-blue-700">{nutritionPercent}%</div>
              </div>
            </div>
          </Card>

          <Button onClick={handleScan} disabled={!selectedImage || isScanning} className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg font-semibold">
            {isScanning ? (<div className="flex items-center gap-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Analyzing Food...</span></div>) : (<div className="flex items-center gap-3"><Apple size={24} /><span>Analyze Food</span></div>)}
          </Button>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        </>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold">Nutrition Analysis Results</h3><Badge className="bg-green-500"><Apple size={14} className="mr-1" />+{scanResult.xp_earned} XP</Badge></div>
            <div className="space-y-6">
              <div className="text-center py-4"><div className="text-6xl mb-4">🍎</div><p className="text-gray-600">{scanResult.message}</p></div>
              <div>
                <h4 className="font-semibold mb-3">Nutrition Breakdown</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-green-600">{scanResult.analysis.calories}</div><div className="text-sm text-gray-600">Calories</div></div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-blue-600">{scanResult.analysis.protein}g</div><div className="text-sm text-gray-600">Protein</div></div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-yellow-600">{scanResult.analysis.carbs}g</div><div className="text-sm text-gray-600">Carbs</div></div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-purple-600">{scanResult.analysis.fat}g</div><div className="text-sm text-gray-600">Fat</div></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"><div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div><div className="flex-1"><p className="font-medium text-gray-900">Food Quality: {scanResult.analysis.healthScore}</p><p className="text-sm text-gray-600">{scanResult.analysis.healthDetails}</p></div></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center"><Apple className="w-5 h-5 text-white" /></div><h4 className="font-semibold text-gray-900">AI Nutrition Recommendation</h4></div>
                <p className="text-gray-700 mb-3">{scanResult.analysis.suggestion}</p>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg"><div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center"><Target className="w-5 h-5 text-indigo-600" /></div><div className="flex-1"><p className="font-medium text-gray-900">Recommended Addition</p><p className="text-sm text-gray-600">{scanResult.analysis.recommendation}</p></div><Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg" onClick={viewSuggestion}>View</Button></div>
              </div>
            </div>
          </Card>
          <div className="space-y-3"><Button onClick={resetScan} variant="outline" className="w-full h-12">Scan Another Meal</Button></div>
        </>
      )}

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><History className="w-5 h-5 text-green-500" />Meal Log</h3><Button variant="ghost" size="sm" className="text-blue-600" onClick={viewAll}>See All</Button></div>
        <div className="grid grid-cols-2 gap-3">
          {mockScanHistory.filter(scan => scan.type === 'food').map((scan) => (
            <div key={scan.id} className="relative rounded-xl overflow-hidden group cursor-pointer">
              <img src={scan.image} alt="Food scan" className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"><div className="absolute bottom-2 left-2"><p className="text-white text-xs font-medium">Nutrition Analysis</p><p className="text-white/80 text-xs">{new Date(scan.date).toLocaleDateString()}</p></div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FoodScanner;