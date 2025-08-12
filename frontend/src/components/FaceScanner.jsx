import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, Sparkles, History, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockSkinAnalysis, mockScanHistory } from "../mock";

const FaceScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  const handleFaceSelfie = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          toast({
            title: "Face Analysis Complete!",
            description: "Your skin analysis is ready. +6 XP earned!"
          });
          return 100;
        }
        return prev + 12;
      });
    }, 250);
  };

  const handleUploadPhoto = () => {
    toast({
      title: "Upload Feature",
      description: "Photo upload will be implemented with backend integration!"
    });
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Face Scanner</h1>
        <p className="text-gray-600 mt-1">Track Your Skin Evolution</p>
        <p className="text-sm text-gray-500 mt-2">
          Upload or snap a selfie. Our AI will instantly analyze your skin, suggest routines, and help you level up your glow.
        </p>
      </div>

      {/* Scan Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleFaceSelfie}
          disabled={isScanning}
          className="h-20 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex flex-col items-center gap-2 transition-all duration-200 transform hover:scale-[1.02]"
        >
          <Camera className="w-6 h-6" />
          <span className="font-medium">{isScanning ? 'Analyzing...' : 'Face Selfie'}</span>
        </Button>

        <Button
          onClick={handleUploadPhoto}
          variant="outline"
          className="h-20 rounded-xl border-2 border-pink-200 hover:border-pink-300 bg-white hover:bg-pink-50 flex flex-col items-center gap-2 transition-all duration-200"
        >
          <Upload className="w-6 h-6 text-pink-600" />
          <span className="font-medium text-pink-600">Upload Photo</span>
        </Button>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <Card className="p-6 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="font-semibold text-gray-900">Analyzing Your Skin...</h3>
            <p className="text-sm text-gray-600">AI is processing your selfie</p>
          </div>
          <Progress value={scanProgress} className="h-3" />
          <p className="text-center text-sm text-gray-500 mt-2">{scanProgress}% Complete</p>
        </Card>
      )}

      {/* Current Skin Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          Current Skin Analysis
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Skin Type: Combination</p>
              <p className="text-sm text-gray-600">Oily T-zone, dry cheek area</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Skin Type: Combination</p>
              <p className="text-sm text-gray-600">{mockSkinAnalysis.concerns}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Routine Suggestion */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">AI Routine Suggestion</h3>
        </div>
        
        <p className="text-gray-700 mb-4">{mockSkinAnalysis.aiSuggestion}</p>
        
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Recommended Product</p>
            <p className="text-sm text-gray-600">{mockSkinAnalysis.recommendedProduct}</p>
          </div>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            View
          </Button>
        </div>
      </Card>

      {/* Glow Progress */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Glow Progress</h3>
          <Badge className="bg-green-100 text-green-700">+65 XP</Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Avatar: Level 2</span>
            <span className="text-sm text-gray-500">Glow is improving</span>
          </div>
          <Progress value={75} className="h-3" />
        </div>
      </Card>

      {/* Scan History */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            History
          </h3>
          <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {mockScanHistory.filter(scan => scan.type === 'face').map((scan) => (
            <div key={scan.id} className="relative rounded-xl overflow-hidden group cursor-pointer">
              <img 
                src={scan.image} 
                alt="Face scan"
                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors">
                <div className="absolute bottom-2 left-2">
                  <p className="text-white text-xs font-medium">Face Analysis</p>
                  <p className="text-white/80 text-xs">{new Date(scan.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Placeholder for more scans */}
          <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 h-24 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="text-center">
              <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Take another scan</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FaceScanner;