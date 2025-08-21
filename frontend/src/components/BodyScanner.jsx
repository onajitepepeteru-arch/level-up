import React, { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Camera, Upload, Zap, History, RotateCcw, Activity } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const BodyScanner = ({ onNavigate }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Max 5MB", variant: "destructive" }); return; }
    try {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch {
      toast({ title: "Preview error", description: "Could not preview image", variant: "destructive" });
    }
  };

  const analyze = async () => {
    if (!selectedFile) { toast({ title: "No photo", description: "Choose a body photo first", variant: "destructive" }); return; }
    setIsScanning(true); setScanProgress(0);
    const t = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(t); setIsScanning(false); setScanResult({
            message: "Body analysis ready",
            analysis: { posture: "Slight forward head tilt", postureDetails: "Mild forward head posture", composition: "Lean-moderate", muscle: "38%", bodyType: "Mesomorph" },
            xp_earned: 8
          }); toast({ title: "Body analyzed", description: "+8 XP" }); return 100; }
        return p + 10;
      });
    }, 180);
  };

  const reset = () => { setScanResult(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setSelectedFile(null); setScanProgress(0); if (fileInputRef.current) fileInputRef.current.value = ""; };
  const viewAll = () => { localStorage.setItem('scanHistoryFilter', 'body'); onNavigate && onNavigate('scan-history'); };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-yellow-600 to-orange-600 text-white px-5 pt-8 pb-6">
        <h1 className="text-2xl font-bold">Body Scanner</h1>
        <p className="text-sm text-white/90">Track Your Physical Evolution</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Select/Preview */}
        <Card className="p-4">
          {previewUrl ? (
            <div className="relative">
              <img src={previewUrl} alt="preview" className="w-full h-64 object-cover rounded-xl border" />
              <Button onClick={reset} variant="outline" size="sm" className="absolute top-2 right-2"><RotateCcw size={16} /></Button>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400">
              <Upload size={44} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-1">Tap to select a body photo</p>
              <p className="text-xs text-gray-500">JPG/PNG up to 5MB</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </Card>

        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => fileInputRef.current?.click()} className="h-20 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 text-white flex flex-col gap-2">
            <Camera className="w-6 h-6" />
            <span className="font-medium">Take Photo</span>
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-20 rounded-xl border-2 border-yellow-200 bg-white hover:bg-yellow-50 flex flex-col gap-2">
            <Upload className="w-6 h-6 text-yellow-600" />
            <span className="font-medium text-yellow-600">Upload Photo</span>
          </Button>
        </div>

        {/* Analyze */}
        <Button onClick={analyze} disabled={!selectedFile || isScanning} className="w-full h-14 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-lg font-semibold">
          {isScanning ? (<div className="flex items-center gap-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Analyzing Body...</span></div>) : (<div className="flex items-center gap-3"><Zap size={22} /><span>Analyze Body</span></div>)}
        </Button>

        {/* Scanning progress */}
        {isScanning && (
          <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="text-center mb-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-r from-yellow-600 to-orange-600 flex items-center justify-center"><Zap className="w-7 h-7 text-white" /></div>
              <div className="mt-2 text-sm text-gray-600">AI is analyzing your body</div>
            </div>
            <Progress value={scanProgress} className="h-2" />
          </Card>
        )}

        {/* Sections */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Body Composition</h3>
          {!scanResult ? (
            <div className="text-sm text-gray-600">Run a body scan to see your composition.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
                <div className="text-sm text-gray-700">Muscle</div>
                <div className="text-sm font-semibold text-blue-700">{scanResult.analysis.muscle} <span className="text-xs text-blue-500">(54% last)</span></div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50">
                <div className="text-sm text-gray-700">Posture</div>
                <div className="text-sm font-semibold text-yellow-700">{scanResult.analysis.posture}</div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-green-50">
                <div className="text-sm text-gray-700">Body Type</div>
                <div className="text-sm font-semibold text-green-700">{scanResult.analysis.bodyType}</div>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Weekly Consistency</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`h-3 rounded ${scanResult ? (i < 5 ? 'bg-orange-500' : 'bg-orange-200') : 'bg-gray-200'}`}></div>
              ))}
            </div>
            <div className="text-xs text-gray-600">{scanResult ? '5/7 days active • 4 scans this week' : '0/7 days active'}</div>
          </div>
        </Card>

        {/* Scan History at bottom */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5 text-orange-600" />Scan History</h3>
            <Button variant="ghost" size="sm" onClick={viewAll}>View All</Button>
          </div>
          <div className="text-sm text-gray-600">Your past body scans will appear here.</div>
        </Card>
      </div>
    </div>
  );
};

export default BodyScanner;