import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Filter, Camera } from "lucide-react";

const ScanHistory = ({ onBack }) => {
  const [type, setType] = useState(localStorage.getItem('scanHistoryFilter') || 'all');
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const url = type === 'all'
          ? `${backendUrl}/api/user/${userId}/scans`
          : `${backendUrl}/api/user/${userId}/scans?scan_type=${type}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setScans(data || []);
        } else {
          setScans([]);
        }
      } catch (e) {
        setScans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, [type]);

  const formatDate = (ts) => {
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const types = [
    { id: 'all', label: 'All' },
    { id: 'body', label: 'Body' },
    { id: 'face', label: 'Face' },
    { id: 'food', label: 'Food' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Scan History</h1>
          <p className="text-sm text-gray-600">View all your past scans</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {types.map(t => (
            <Button
              key={t.id}
              variant={type === t.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setType(t.id)}
            >
              <Filter className="w-4 h-4 mr-2" /> {t.label}
            </Button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : scans.length === 0 ? (
          <Card className="p-8 text-center">
            <Camera size={40} className="mx-auto mb-2 text-gray-400" />
            <div className="text-gray-700 font-medium">No scans yet</div>
            <div className="text-sm text-gray-500">Your scans will appear here</div>
          </Card>
        ) : (
          <div className="space-y-3">
            {scans.map(s => (
              <Card key={s.id || s._id} className="p-3 flex items-center gap-3">
                <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                  {s.scan_type === 'body' ? '💪' : s.scan_type === 'face' ? '✨' : '🍎'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold capitalize">{s.scan_type} scan</div>
                    <Badge variant="secondary">{formatDate(s.timestamp)}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {s.analysis_result?.message || 'Analysis saved'}
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">+{s.xp_earned || 0} XP</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanHistory;