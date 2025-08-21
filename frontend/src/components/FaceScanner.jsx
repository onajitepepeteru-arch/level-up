import React, { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, Sparkles, History, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockSkinAnalysis, mockScanHistory } from "../mock";

const FaceScanner = ({ onNavigate }) => {
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
      if (file.size > 5 * 1024 * 1024) { toast({ title: "Error", description: "Image size must be less than 5MB", variant: "destructive" }); return; }
      if (!file.type.startsWith('image/')) { toast({ title: "Error", description: "Please select a valid image file", variant: "destructive" }); return; }
      setSelectedImage(file);
      const reader = new FileReader(); reader.onload = (e) => setImagePreview(e.target.result); reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) { toast({ title: "No Image Selected", description: "Please select a face image to scan first", variant: "destructive" }); return; }
    setIsScanning(true); setScanProgress(0);
    const interval = setInterval(() => { setScanProgress(prev => { if (prev >= 100) { clearInterval(interval); setIsScanning(false); setScanResult({ message: "Face scan completed successfully!", analysis: mockSkinAnalysis, xp_earned: 6 }); toast({ title: "Face Analysis Complete!", description: "+6 XP earned!" }); return 100; } return prev + 12; }); }, 250);
  };

  const handleFaceSelfie = () => fileInputRef.current?.click();
  const handleUploadPhoto = () => fileInputRef.current?.click();

  const resetScan = () => { setScanResult(null); setSelectedImage(null); setImagePreview(null); setScanProgress(0); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const viewAll = () => { localStorage.setItem('scanHistoryFilter', 'face'); onNavigate && onNavigate('scan-history'); };
  const viewProduct = () => { onNavigate && onNavigate('ai-chat'); };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen pb-20">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Face Scanner</h1>
        <p className="text-gray-600 mt-1">Track Your Skin Evolution</p>
        <p className="text-sm text-gray-500 mt-2">Upload or snap a selfie. Our AI will instantly analyze your skin, suggest routines, and help you level up your glow.</p>
      </div>

      {!scanResult ? (
        <>
          {imagePreview ? (
            <Card className="p-6">
              <div className="relative">
                <img src={imagePreview} alt="Selected selfie" className="w-full h-64 object-cover rounded-lg border-2 border-gray-200" />
                <Button onClick={resetScan} variant="outline" size="sm" className="absolute top-2 right-2"><RotateCcw size={16} /></Button>
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">Selfie selected. Ready to analyze your skin!</p>
            </Card>
          ) : (
            <Card className="p-6">
              <div onClick={handleUploadPhoto} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">Click to select a selfie</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG up to 5MB</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleFaceSelfie} disabled={isScanning} className="h-20 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex flex-col items-center gap-2">
              <Camera className="w-6 h-6" />
              <span className="font-medium">Take Selfie</span>
            </Button>
            <Button onClick={handleUploadPhoto} variant="outline" className="h-20 rounded-xl border-2 border-pink-200 hover:border-pink-300 bg-white hover:bg-pink-50 flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-pink-600" />
              <span className="font-medium text-pink-600">Upload Photo</span>
            </Button>
          </div>

          <Button onClick={handleScan} disabled={!selectedImage || isScanning} className="w-full h-16 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-lg font-semibold">
            {isScanning ? (<div className="flex items-center gap-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Analyzing Skin...</span></div>) : (<div className="flex items-center gap-3"><Sparkles size={24} /><span>Analyze Face</span></div>)}
          </Button>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" capture="user" />
        </>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold">Skin Analysis Results</h3><Badge className="bg-pink-500"><Sparkles size={14} className="mr-1" />+{scanResult.xp_earned} XP</Badge></div>
            <div className="space-y-6">
              <div className="text-center py-4"><div className="text-6xl mb-4">✨</div><p className="text-gray-600">{scanResult.message}</p></div>
              <div>
                <h4 className="font-semibold mb-3">Current Skin Analysis</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg"><div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-pink-600" /></div><div className="flex-1"><p className="font-medium text-gray-900">Skin Type: {scanResult.analysis.skinType}</p><p className="text-sm text-gray-600">{scanResult.analysis.description}</p></div></div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg"><div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-yellow-600" /></div><div className="flex-1"><p className="font-medium text-gray-900">Areas for Improvement</p><p className="text-sm text-gray-600">{scanResult.analysis.concerns}</p></div></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div><h4 className="font-semibold text-gray-900">AI Routine Suggestion</h4></div>
                <p className="text-gray-700 mb-3">{scanResult.analysis.aiSuggestion}</p>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg"><div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center"><Sparkles className="w-5 h-5 text-indigo-600" /></div><div className="flex-1"><p className="font-medium text-gray-900">Recommended Product</p><p className="text-sm text-gray-600">{scanResult.analysis.recommendedProduct}</p></div><Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg" onClick={viewProduct}>View</Button></div>
              </div>
            </div>
          </Card>
          <div className="space-y-3"><Button onClick={resetScan} variant="outline" className="w-full h-12">Scan Again</Button></div>
        </>
      )}

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><History className="w-5 h-5 text-purple-500" />History</h3><Button variant="ghost" size="sm" className="text-blue-600" onClick={viewAll}>View All</Button></div>
        <div className="grid grid-cols-2 gap-3">
          {mockScanHistory.filter(scan => scan.type === 'face').map((scan) => (
            <div key={scan.id} className="relative rounded-xl overflow-hidden group cursor-pointer">
              <img src={scan.image} alt="Face scan" className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"><div className="absolute bottom-2 left-2"><p className="text-white text-xs font-medium">Face Analysis</p><p className="text-white/80 text-xs">{new Date(scan.date).toLocaleDateString()}</p></div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FaceScanner;