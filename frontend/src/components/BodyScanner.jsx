import React, { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, Zap, History, Target, CheckCircle, RotateCcw } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockBodyAnalysis, mockScanHistory } from "../mock";

const BodyScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select a body image to scan first",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanResult({
            message: "Body scan completed successfully!",
            analysis: mockBodyAnalysis,
            xp_earned: 8
          });
          toast({
            title: "Body Analysis Complete!",
            description: "Your posture and body analysis is ready. +8 XP earned!"
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleBodyPhoto = () => {
    fileInputRef.current?.click();
  };

  const handleUploadPhoto = () => {
    fileInputRef.current?.click();
  };

  const resetScan = () => {
    setScanResult(null);
    setSelectedImage(null);
    setImagePreview(null);
    setScanProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Body Scanner</h1>
        <p className="text-gray-600 mt-1">Track Your Physical Evolution</p>
        <p className="text-sm text-gray-500 mt-2">
          Upload or take a body photo. Our AI will analyze your posture, muscle definition, and provide personalized recommendations.
        </p>
      </div>

      {!scanResult ? (
        <>
          {/* Image Selection/Preview */}
          {imagePreview ? (
            <Card className="p-6">
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Selected body photo" 
                  className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                />
                <Button
                  onClick={resetScan}
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <RotateCcw size={16} />
                </Button>
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">
                Body photo selected. Ready to analyze your physique!
              </p>
            </Card>
          ) : (
            <Card className="p-6">
              <div 
                onClick={handleUploadPhoto}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">Click to select a body photo</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG up to 5MB</p>
              </div>
            </Card>
          )}

          {/* Scan Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleBodyPhoto}
              disabled={isScanning}
              className="h-20 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white flex flex-col items-center gap-2 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Camera className="w-6 h-6" />
              <span className="font-medium">Take Photo</span>
            </Button>

            <Button
              onClick={handleUploadPhoto}
              variant="outline"
              className="h-20 rounded-xl border-2 border-yellow-200 hover:border-yellow-300 bg-white hover:bg-yellow-50 flex flex-col items-center gap-2 transition-all duration-200"
            >
              <Upload className="w-6 h-6 text-yellow-600" />
              <span className="font-medium text-yellow-600">Upload Photo</span>
            </Button>
          </div>

          {/* Scan Button */}
          <Button 
            onClick={handleScan}
            disabled={!selectedImage || isScanning}
            className="w-full h-16 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-lg font-semibold"
          >
            {isScanning ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing Body...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Zap size={24} />
                <span>Analyze Body</span>
              </div>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </>
      ) : (
        <>
          {/* Scan Results */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Body Analysis Results</h3>
              <Badge className="bg-yellow-500">
                <Zap size={14} className="mr-1" />
                +{scanResult.xp_earned} XP
              </Badge>
            </div>

            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="text-6xl mb-4">💪</div>
                <p className="text-gray-600">{scanResult.message}</p>
              </div>

              {/* Current Body Analysis */}
              <div>
                <h4 className="font-semibold mb-3">Current Body Analysis</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Posture Analysis: {scanResult.analysis.posture}</p>
                      <p className="text-sm text-gray-600">{scanResult.analysis.postureDetails}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Body Composition</p>
                      <p className="text-sm text-gray-600">{scanResult.analysis.composition}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Workout Suggestion */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">AI Workout Recommendation</h4>
                </div>
                
                <p className="text-gray-700 mb-3">{scanResult.analysis.workoutSuggestion}</p>
                
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Recommended Focus</p>
                    <p className="text-sm text-gray-600">{scanResult.analysis.focusArea}</p>
                  </div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                    View Plan
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={resetScan}
              variant="outline" 
              className="w-full h-12"
            >
              Scan Again
            </Button>
          </div>
        </>
      )}

      {/* Scanning Progress */}
      {isScanning && (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-600 to-orange-600 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="font-semibold text-gray-900">Analyzing Your Body...</h3>
            <p className="text-sm text-gray-600">AI is processing your photo</p>
          </div>
          <Progress value={scanProgress} className="h-3" />
          <p className="text-center text-sm text-gray-500 mt-2">{scanProgress}% Complete</p>
        </Card>
      )}

      {/* Progress Tracking */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Body Progress</h3>
          <Badge className="bg-green-100 text-green-700">+120 XP</Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Fitness Level: Beginner+</span>
            <span className="text-sm text-gray-500">Great improvement!</span>
          </div>
          <Progress value={45} className="h-3" />
        </div>
      </Card>

      {/* Scan History */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-orange-500" />
            History
          </h3>
          <Button variant="ghost" size="sm" className="text-blue-600">View All</Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {mockScanHistory.filter(scan => scan.type === 'body').map((scan) => (
            <div key={scan.id} className="relative rounded-xl overflow-hidden group cursor-pointer">
              <img 
                src={scan.image} 
                alt="Body scan"
                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors">
                <div className="absolute bottom-2 left-2">
                  <p className="text-white text-xs font-medium">Body Analysis</p>
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

export default BodyScanner;