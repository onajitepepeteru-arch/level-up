import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Camera, Upload, Zap, RotateCcw } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const FoodScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
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
        description: "Please select a food image to scan first",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Please log in to continue');
      }

      const formData = new FormData();
      formData.append('file', selectedImage);
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/scan/food?user_id=${userId}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setScanResult(data);
        toast({
          title: "Scan Complete!",
          description: `Food scan completed! You earned ${data.xp_earned} XP.`,
        });
      } else {
        throw new Error(data.detail || 'Scan failed');
      }
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error.message || "Unable to complete scan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Food Scanner</h1>
            <p className="text-white/90">Track nutrition & calories</p>
          </div>
          <div className="text-4xl">🍎</div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!scanResult ? (
          <>
            {/* Instructions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Scanning Instructions</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">1</span>
                  </div>
                  <p>Place food on a clean, plain surface</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">2</span>
                  </div>
                  <p>Ensure all food items are clearly visible</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">3</span>
                  </div>
                  <p>Take photo from directly above for best accuracy</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">4</span>
                  </div>
                  <p>Use good lighting to avoid shadows</p>
                </div>
              </div>
            </Card>

            {/* Image Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Food Photo</h3>
              
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Selected food" 
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
                  <p className="text-sm text-gray-600 text-center">
                    Food image selected. Ready to analyze nutrition!
                  </p>
                </div>
              ) : (
                <div 
                  onClick={triggerFileSelect}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Click to select a food image</p>
                  <p className="text-sm text-gray-500">Supports JPG, PNG up to 5MB</p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </Card>

            {/* Scan Button */}
            <Button 
              onClick={handleScan}
              disabled={!selectedImage || isScanning}
              className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-lg font-semibold"
            >
              {isScanning ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing Nutrition...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Camera size={24} />
                  <span>Scan Food</span>
                </div>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Scan Results */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Nutrition Analysis</h3>
                <Badge className="bg-green-500">
                  <Zap size={14} className="mr-1" />
                  +{scanResult.xp_earned} XP
                </Badge>
              </div>

              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="text-6xl mb-4">🍎</div>
                  <p className="text-gray-600">{scanResult.analysis?.message}</p>
                </div>

                {/* Nutrition Info */}
                {scanResult.analysis?.nutrition && (
                  <div>
                    <h4 className="font-semibold mb-3">Nutrition Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {scanResult.analysis.nutrition.calories}
                        </div>
                        <div className="text-sm text-gray-600">Calories</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {scanResult.analysis.nutrition.protein}
                        </div>
                        <div className="text-sm text-gray-600">Protein</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {scanResult.analysis.nutrition.carbs}
                        </div>
                        <div className="text-sm text-gray-600">Carbs</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {scanResult.analysis.nutrition.fat}
                        </div>
                        <div className="text-sm text-gray-600">Fat</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {scanResult.analysis?.recommendations && (
                  <div>
                    <h4 className="font-semibold mb-3">Nutrition Tips</h4>
                    <div className="space-y-2">
                      {scanResult.analysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-white">{index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={resetScan}
                variant="outline" 
                className="w-full h-12"
              >
                Scan Another Meal
              </Button>
            </div>
          </>
        )}

        {/* Quick Stats */}
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-center">Food Scan Benefits</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <p className="text-gray-600">Track Calories</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🥗</div>
              <p className="text-gray-600">Nutrition Info</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-gray-600">Reach Goals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-gray-600">Earn +5 XP</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FoodScanner;