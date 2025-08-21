import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Camera, Upload, Zap, History, RotateCcw } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const BodyScanner = ({ onNavigate }) => {
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
    if (!selectedFile) { toast({ title: "No photo", description: "Choose a body photo first", variant: "destructive" }); return; }
    setIsScanning(true); setScanProgress(0);
    const t = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(t); setIsScanning(false); setScanResult({
          message: "Body analysis ready",
          analysis: { posture: "Forward head", postureDetails: "Mild forward head posture", composition: "Lean-moderate", muscle: "Developing", bodyType: "Mesomorph", focusArea: "Upper back" },
          xp_earned: 8
        }); toast({ title: "Body analyzed", description: "+8 XP" }); return 100; }
        return p + 10;
      });
    }, 200);
  };

  const reset = () => { setScanResult(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setSelectedFile(null); setScanProgress(0); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const viewAll = () => { localStorage.setItem('scanHistoryFilter', 'body'); onNavigate && onNavigate('scan-history'); };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen pb-20">
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold text-gray-900">Body Scanner</h1>
        <p className="text-gray-600 mt-1">Track Your Physical Evolution</p>
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
            <p className="text-gray-600 mb-2">Click to select a body photo</p>
            <p className="text-sm text-gray-500">Supports JPG/PNG up to 5MB</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </Card>

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

      <Button onClick={analyze} disabled={!selectedFile || isScanning} className="w-full h-14 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-lg font-semibold">
        {isScanning ? (<div className="flex items-center gap-3"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Analyzing Body...</span></div>) : (<div className="flex items-center gap-3"><Zap size={22} /><span>Analyze Body</span></div>)}
      </Button>

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
              <div className="text-sm font-semibold text-blue-700">38% <span className="text-xs text-blue-500">(54% last)</span></div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50">
              <div className="text-sm text-gray-700">Posture</div>
              <div className="text-sm font-semibold text-yellow-700">Slight forward head tilt detected</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50">
              <div className="text-sm text-gray-700">Body Type</div>
              <div className="text-sm font-semibold text-green-700">Mesomorph</div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Weekly Consistency</h3>
        <div className="space-y-2">
          <Progress value={scanResult ? 72 : 0} className="h-2" />
          <div className="text-xs text-gray-600">2 days streak • 4 scans this week</div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5 text-orange-600" />Scan History</h3>
          <Button variant="ghost" size="sm" onClick={viewAll}>View All</Button>
        </div>
        <div className="text-sm text-gray-600">Your past body scans will appear here.</div>
      </Card>
    </div>
  );
};

export default BodyScanner;