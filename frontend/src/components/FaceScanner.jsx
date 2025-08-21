import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, Sparkles, History, RotateCcw, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const FaceScanner = ({ onNavigate }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Max 5MB", variant: "destructive" }); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const analyze = async () => {
    if (!selectedFile) { toast({ title: "No photo", description: "Choose a selfie first", variant: "destructive" }); return; }
    setIsScanning(true); setScanProgress(0);
    const t = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(t); setIsScanning(false); setScanResult({
          message: "Skin analysis ready",
          analysis: { skinType: "Combination", concerns: "Dullness, Dry patches", aiSuggestion: "Use vitamin C serum", recommendedProduct: "Vitamin C + HA" },
          glow: { progress: 68 },
          xp_earned: 6
        }); toast({ title: "Face analyzed", description: "+6 XP" }); return 100; }
        return p + 10;
      });
    }, 200);
  };

  const reset = () => { setScanResult(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setSelectedFile(null); setScanProgress(0); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const viewAll = () => { localStorage.setItem('scanHistoryFilter', 'face'); onNavigate && onNavigate('scan-history'); };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen pb-20">
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold text-gray-900">Face Scanner</h1>
        <p className="text-gray-600 mt-1">Track Your Skin Evolution</p>
      </div>

      <Card className="p-6">
        {previewUrl ? (
          <div className="relative">
            <img src={previewUrl} alt="preview" className="w-full h-64 object-cover rounded-lg border" />
            <Button onClick={reset} variant="outline" size="sm" className="absolute top-2 right-2"><RotateCcw size={16} /></Button>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Click to select a selfie</p>
            <p className="text-sm text-gray-500">Supports JPG/PNG up to 5MB</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" capture="user" />
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => fileInputRef.current?.click()} className="h-20 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white flex flex-col gap-2">
          <Camera className="w-6 h-6" />
          <span className="font-medium">Take Selfie</span>
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-20 rounded-xl border-2 border-pink-200 bg-white hover:bg-pink-50 flex flex-col gap-2">
          <Upload className="w-6 h-6 text-pink-600" />
          <span className="font-medium text-pink-600">Upload Photo</span>
        </Button>
      </div>

      <Button onClick={analyze} disabled={!selectedFile || isScanning} className="w-full h-14 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-lg font-semibold">
        {isScanning ? (<div className="flex items-center gap-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Analyzing Skin...</span></div>) : (<div className="flex items-center gap-3"><Sparkles size={22} /><span>Analyze Face</span></div>)}
      </Button>

      {isScanning && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="text-center mb-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center"><Sparkles className="w-7 h-7 text-white" /></div>
            <div className="mt-2 text-sm text-gray-600">AI is analyzing your skin</div>
          </div>
          <Progress value={scanProgress} className="h-2" />
        </Card>
      )}

      {/* Sections */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Current Skin Analysis</h3>
        {!scanResult ? (
          <div className="text-sm text-gray-600">Run a face scan to see your analysis.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-pink-50">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-pink-600" /></div>
              <div className="flex-1">
                <div className="font-medium">Skin Type: {scanResult.analysis.skinType}</div>
                <div className="text-sm text-gray-700">Oily T-zone, dry cheek area</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-yellow-50">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-yellow-600" /></div>
              <div className="flex-1">
                <div className="font-medium">Skin Type: {scanResult.analysis.skinType}</div>
                <div className="text-sm text-gray-700">Minor acne, slight acne tone</div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">AI Routine Suggestion</h3>
        {!scanResult ? (
          <div className="text-sm text-gray-600">Run a face scan to get your routine.</div>
        ) : (
          <div className="space-y-3 rounded-xl border bg-blue-50 p-3">
            <div className="text-sm text-gray-700">Gentle cleansing, niacinamide, SPF 50+</div>
            <div className="flex items-center justify-between bg-white rounded-lg p-3">
              <div>
                <div className="text-xs text-gray-500">Recommended Product</div>
                <div className="text-sm font-medium text-gray-800">{scanResult.analysis.recommendedProduct || 'Youth-Glow Serum'}</div>
              </div>
              <Button size="sm" className="rounded-lg">View</Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Glow Progress</h3>
          {scanResult && <Badge className="bg-green-100 text-green-700">+65 XP</Badge>}
        </div>
        {!scanResult ? (
          <div className="text-sm text-gray-600">Complete a few scans to track your glow progress.</div>
        ) : (
          <div>
            <div className="text-sm text-gray-700 mb-1"><span className="text-gray-500">Avatar:</span> Level 2 <span className="ml-2 text-gray-500">Glow is improving</span></div>
            <Progress value={scanResult.glow?.progress || 0} className="h-2" />
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5 text-purple-600" />Scan History</h3>
          <Button variant="ghost" size="sm" onClick={viewAll}>View All</Button>
        </div>
        <div className="text-sm text-gray-600">Your past face scans will appear here.</div>
      </Card>
    </div>
  );
};

export default FaceScanner;