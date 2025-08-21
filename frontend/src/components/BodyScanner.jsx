import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Camera, Upload, Zap, TrendingUp, RotateCcw } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const BodyScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to scan first",
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
      const response = await fetch(`${backendUrl}/api/scan/body?user_id=${userId}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setScanResult(data);
        
        if (data.status === 'pending_review') {
          toast({
            title: "Image Under Review",
            description: "Your image is being reviewed for compliance. Results will be available soon.",
            variant: "default"
          });
        } else {
          toast({
            title: "Scan Complete!",
            description: `Body scan completed! You earned ${data.xp_earned} XP.`,
          });
        }
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
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Body Scanner</h1>
            <p className="text-white/90">Track your posture & body composition</p>
          </div>
          <div className="text-4xl">💪</div>
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
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <p>Stand upright against a plain background</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <p>Wear fitted clothing for accurate analysis</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <p>Ensure good lighting for best results</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">4</span>
                  </div>
                  <p>Take full-body photo from head to toe</p>
                </div>
              </div>
            </Card>

            {/* Image Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Upload Photo</h3>
              
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Selected" 
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
                    Image selected. Ready to scan!
                  </p>
                </div>
              ) : (
                <div 
                  onClick={triggerFileSelect}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Click to select an image</p>
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
              className="w-full h-16 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-lg font-semibold"
            >
              {isScanning ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing Body...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Camera size={24} />
                  <span>Start Body Scan</span>
                </div>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Scan Results */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Scan Results</h3>
                <Badge className="bg-green-500">
                  <Zap size={14} className="mr-1" />
                  +{scanResult.xp_earned} XP
                </Badge>
              </div>

              {scanResult.status === 'pending_review' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={32} className="text-yellow-600" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Under Review</h4>
                  <p className="text-gray-600 mb-4">{scanResult.analysis?.message}</p>
                  <p className="text-sm text-gray-500">
                    We'll notify you when your results are ready.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <div className="text-6xl mb-4">💪</div>
                    <p className="text-gray-600">{scanResult.analysis?.message}</p>
                  </div>

                  {scanResult.analysis?.recommendations && (
                    <div>
                      <h4 className="font-semibold mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {scanResult.analysis.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                            <p className="text-sm text-gray-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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

        {/* Quick Stats */}
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-center">Body Scan Benefits</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <p className="text-gray-600">Track Progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-gray-600">Set Goals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">💪</div>
              <p className="text-gray-600">Build Muscle</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-gray-600">Earn +8 XP</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BodyScanner;