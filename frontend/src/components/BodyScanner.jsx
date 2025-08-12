import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, BarChart3, Eye, Calendar } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockBodyComposition, mockScanHistory } from "../mock";

const BodyScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  const handleCapture = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          toast({
            title: "Scan Complete!",
            description: "Your body analysis is ready. +8 XP earned!"
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleUpload = () => {
    toast({
      title: "Upload Feature",
      description: "Photo upload will be implemented with backend integration!"
    });
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Body Scanner</h1>
        <p className="text-gray-600 mt-1">Full-Body Analysis</p>
        <p className="text-sm text-gray-500 mt-2">
          Upload or capture a full-body photo. Our AI will analyze your body type, posture, and composition to help you level up.
        </p>
      </div>

      {/* Scan Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleCapture}
          disabled={isScanning}
          className="h-20 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex flex-col items-center gap-2 transition-all duration-200 transform hover:scale-[1.02]"
        >
          <Camera className="w-6 h-6" />
          <span className="font-medium">{isScanning ? 'Scanning...' : 'Capture'}</span>
        </Button>

        <Button
          onClick={handleUpload}
          variant="outline"
          className="h-20 rounded-xl border-2 border-purple-200 hover:border-purple-300 bg-white hover:bg-purple-50 flex flex-col items-center gap-2 transition-all duration-200"
        >
          <Upload className="w-6 h-6 text-purple-600" />
          <span className="font-medium text-purple-600">Upload</span>
        </Button>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Eye className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="font-semibold text-gray-900">Analyzing Your Body...</h3>
            <p className="text-sm text-gray-600">AI is processing your scan</p>
          </div>
          <Progress value={scanProgress} className="h-3" />
          <p className="text-center text-sm text-gray-500 mt-2">{scanProgress}% Complete</p>
        </Card>
      )}

      {/* Body Composition Results */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Body Composition
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="font-medium text-gray-700">Muscle</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {mockBodyComposition.muscle}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
            <span className="font-medium text-gray-700">Posture</span>
            <span className="text-sm text-gray-600">{mockBodyComposition.posture}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="font-medium text-gray-700">Body Type</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {mockBodyComposition.bodyType}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Weekly Consistency */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Consistency</h3>
          <span className="text-sm text-gray-500">37 Days</span>
        </div>
        
        <div className="mb-4">
          <Progress value={87} className="h-4 bg-gray-200" />
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <div key={day} className={`text-center py-2 rounded-lg text-sm font-medium ${
              index < 5 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {day}
            </div>
          ))}
        </div>
      </Card>

      {/* Scan History */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Scan History
          </h3>
          <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {mockScanHistory.map((scan) => (
            <div key={scan.id} className="relative rounded-xl overflow-hidden group cursor-pointer">
              <img 
                src={scan.image} 
                alt={`${scan.type} scan`}
                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors">
                <div className="absolute bottom-2 left-2">
                  <p className="text-white text-xs font-medium capitalize">{scan.type} Scan</p>
                  <p className="text-white/80 text-xs">{new Date(scan.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default BodyScanner;