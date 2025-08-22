import { useEffect, useState } from "react";

export default function SpeedTestDashboard() {
  const [speedData, setSpeedData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testPhase, setTestPhase] = useState(""); // "ping", "download", "upload"
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [currentIsp, setCurrentIsp] = useState(null);

  const BASE_URL = "http://127.0.0.1:5000";

  // Simulate test progress for better UX
  const simulateProgress = () => {
    setTestProgress(0);
    setTestPhase("ping");
    
    const phases = [
      { name: "ping", duration: 1000 },
      { name: "download", duration: 3000 },
      { name: "upload", duration: 2000 }
    ];
    
    let currentProgress = 0;
    let phaseIndex = 0;
    
    const interval = setInterval(() => {
      currentProgress += 2;
      setTestProgress(currentProgress);
      
      if (currentProgress >= 33 && phaseIndex === 0) {
        setTestPhase("download");
        phaseIndex = 1;
      } else if (currentProgress >= 66 && phaseIndex === 1) {
        setTestPhase("upload");
        phaseIndex = 2;
      }
      
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 50);
    
    return interval;
  };

  // Run Speed Test
  const runSpeedTest = async () => {
    console.log("🚀 Starting speed test...");
    setLoading(true);
    setError(null);
    setSpeedData(null); // Clear previous data
    
    const progressInterval = simulateProgress();

    try {
      const response = await fetch(`${BASE_URL}/speedtest`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data');
      }
      
      console.log("Speed test data received:", data);
      
      setSpeedData(data);
      
      // Safely set ISP info
      if (data.isp_info && typeof data.isp_info === 'object') {
        setCurrentIsp(data.isp_info);
      }
      
      // Show support modal if connection quality is poor
      if (data.quality_assessment && 
          data.quality_assessment.should_contact_support === true) {
        setShowSupportModal(true);
      }
      
      console.log("Speed test successful!");
      console.table(data);
      
      // Fetch history after successful test
      await fetchHistory();
      
    } catch (error) {
      console.error("Error running speed test:", error);
      setError(`Failed to run speed test: ${error.message}. Please check if the backend is running on ${BASE_URL}`);
      clearInterval(progressInterval);
      setTestProgress(0);
      setTestPhase("");
    } finally {
      setLoading(false);
      setTestProgress(0);
      setTestPhase("");
      console.log("⏹️ Speed test completed.");
    }
  };

  // Fetch Speed Test History
  const fetchHistory = async () => {
    console.log("📜 Fetching speed test history...");
    
    try {
      const response = await fetch(`${BASE_URL}/history`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setHistory(data);
        console.log("📊 History loaded:", data);
      } else {
        console.warn("History data is not an array:", data);
        setHistory([]);
      }
    } catch (error) {
      console.error("❌ Error fetching history:", error);
      setError(`Failed to load history: ${error.message}`);
      setHistory([]);
    }
  };

  // Toggle History View
  const toggleHistory = () => {
    if (!showHistory) {
      fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  // Detect current ISP on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([
          fetchHistory(),
          detectCurrentISP()
        ]);
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };
    
    initializeApp();
  }, []);

  const detectCurrentISP = async () => {
    try {
      const response = await fetch(`${BASE_URL}/detect-isp`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.isp_info) {
        setCurrentIsp(data.isp_info);
      }
    } catch (error) {
      console.error("Error detecting ISP:", error);
      // Don't show error to user for ISP detection failure
    }
  };

  const getQualityColor = (quality) => {
    if (!quality || typeof quality !== 'string') return 'text-gray-400';
    
    switch (quality.toLowerCase()) {
      case 'good': return 'text-green-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityBgColor = (quality) => {
    if (!quality || typeof quality !== 'string') return 'bg-gray-500/20 border-gray-500/30';
    
    switch (quality.toLowerCase()) {
      case 'good': return 'bg-green-500/20 border-green-500/30';
      case 'fair': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'poor': return 'bg-red-500/20 border-red-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const CircularProgress = ({ progress, phase }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(59, 130, 246, 0.1)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {Math.round(progress)}%
          </div>
          <div className="text-sm text-gray-400 mt-1 capitalize">
            {phase ? `Testing ${phase}...` : "Initializing..."}
          </div>
        </div>
      </div>
    );
  };

  const SupportModal = ({ isOpen, onClose, ispInfo, qualityAssessment }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-gray-700/50">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-red-400">Connection Issues Detected</h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {qualityAssessment && typeof qualityAssessment === 'object' && (
              <div className="mb-6">
                <div className={`p-4 rounded-xl border ${getQualityBgColor(qualityAssessment.quality)} mb-4`}>
                  <h4 className={`font-semibold ${getQualityColor(qualityAssessment.quality)} mb-2`}>
                    Connection Quality: {qualityAssessment.quality ? qualityAssessment.quality.toUpperCase() : 'UNKNOWN'}
                  </h4>
                  
                  {Array.isArray(qualityAssessment.issues) && qualityAssessment.issues.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-300 mb-2">Issues found:</p>
                      <ul className="text-sm text-red-300 space-y-1">
                        {qualityAssessment.issues.map((issue, index) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(qualityAssessment.recommendations) && qualityAssessment.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-300 mb-2">Recommendations:</p>
                      <ul className="text-sm text-yellow-300 space-y-1">
                        {qualityAssessment.recommendations.map((rec, index) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {ispInfo && typeof ispInfo === 'object' && ispInfo.name && (
              <div className="bg-gray-700/30 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-blue-400 mb-4">
                  Contact {ispInfo.name} Support
                </h4>
                
                <div className="space-y-3 text-sm">
                  {ispInfo.support_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Phone:</span>
                      <a href={`tel:${ispInfo.support_phone}`} className="text-blue-400 hover:text-blue-300">
                        {ispInfo.support_phone}
                      </a>
                    </div>
                  )}
                  
                  {ispInfo.support_email && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Email:</span>
                      <a href={`mailto:${ispInfo.support_email}`} className="text-blue-400 hover:text-blue-300 break-all">
                        {ispInfo.support_email}
                      </a>
                    </div>
                  )}

                  {ispInfo.whatsapp && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">WhatsApp:</span>
                      <a href={`https://wa.me/${ispInfo.whatsapp.replace(/\s+/g, '')}`} className="text-green-400 hover:text-green-300">
                        {ispInfo.whatsapp}
                      </a>
                    </div>
                  )}

                  {ispInfo.website && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Website:</span>
                      <a href={ispInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        Support Page
                      </a>
                    </div>
                  )}

                  {ispInfo.live_chat && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Live Chat:</span>
                      <a href={ispInfo.live_chat} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                        Chat Now
                      </a>
                    </div>
                  )}

                  {ispInfo.social_media && typeof ispInfo.social_media === 'object' && (
                    <div className="pt-3 border-t border-gray-600">
                      <p className="text-gray-300 mb-2">Social Media:</p>
                      <div className="flex gap-4">
                        {ispInfo.social_media.twitter && (
                          <a href={`https://twitter.com/${ispInfo.social_media.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            Twitter
                          </a>
                        )}
                        {ispInfo.social_media.facebook && (
                          <a href={`https://facebook.com/${ispInfo.social_media.facebook}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                            Facebook
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
              {ispInfo && ispInfo.support_phone && (
                <a 
                  href={`tel:${ispInfo.support_phone}`}
                  className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-center transition-colors"
                >
                  Call Support Now
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading fallback
  if (loading && !speedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <CircularProgress progress={testProgress} phase={testPhase} />
          <p className="mt-4 text-gray-400">Running speed test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20"></div>
        <div className="relative px-6 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-4">
              SpeedTest Pro
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Professional network performance monitoring for ISP clients
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                Afrihost Compatible
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                Vodacom Ready
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Telkom Verified
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Rain Optimized
              </span>
              {currentIsp && currentIsp.name && currentIsp.name !== "Unknown ISP" && (
                <span className="flex items-center gap-2 bg-blue-600/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  Connected via {currentIsp.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <p className="text-red-400 text-center">{error}</p>
            <div className="text-center mt-2">
              <button 
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-200 underline text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Test Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Speed Test Control */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
            <div className="text-center">
              {loading ? (
                <div className="mb-6">
                  <CircularProgress progress={testProgress} phase={testPhase} />
                </div>
              ) : (
                <div className="mb-6">
                  <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                    <div className="text-6xl">⚡</div>
                  </div>
                </div>
              )}

              <button
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg shadow-blue-500/25"
                onClick={runSpeedTest}
                disabled={loading}
              >
                {loading ? "Testing in Progress..." : "Start Speed Test"}
              </button>
            </div>
          </div>

          {/* Latest Results */}
          {speedData && typeof speedData === 'object' && (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Latest Results
                </h2>
                {speedData.quality_assessment && speedData.quality_assessment.quality && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityBgColor(speedData.quality_assessment.quality)}`}>
                    <span className={getQualityColor(speedData.quality_assessment.quality)}>
                      {speedData.quality_assessment.quality.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* ISP Information */}
              {speedData.isp_info && speedData.isp_info.name && speedData.isp_info.name !== "Unknown ISP" && (
                <div className="bg-gray-700/30 rounded-xl p-4 mb-4 border border-gray-600/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-cyan-400">🌐</span>
                      </div>
                      <span className="text-gray-300">Connected via</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-cyan-400">{speedData.isp_info.name}</span>
                      <button
                        onClick={() => setShowSupportModal(true)}
                        className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30 transition-colors"
                      >
                        Support Info
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-400">📍</span>
                    </div>
                    <span className="text-gray-300">Ping</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-400">
                    {typeof speedData.ping === 'number' ? speedData.ping : 'N/A'} ms
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-green-400">⬇️</span>
                    </div>
                    <span className="text-gray-300">Download</span>
                  </div>
                  <span className="text-xl font-bold text-green-400">
                    {typeof speedData.download_speed === 'number' ? speedData.download_speed.toFixed(2) : 'N/A'} Mbps
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-blue-400">⬆️</span>
                    </div>
                    <span className="text-gray-300">Upload</span>
                  </div>
                  <span className="text-xl font-bold text-blue-400">
                    {typeof speedData.upload_speed === 'number' ? speedData.upload_speed.toFixed(2) : 'N/A'} Mbps
                  </span>
                </div>

                {/* Quality Assessment Details */}
                {speedData.quality_assessment && 
                 typeof speedData.quality_assessment === 'object' && 
                 ((Array.isArray(speedData.quality_assessment.issues) && speedData.quality_assessment.issues.length > 0) || 
                  (Array.isArray(speedData.quality_assessment.recommendations) && speedData.quality_assessment.recommendations.length > 0)) && (
                  <div className={`p-4 rounded-xl border ${getQualityBgColor(speedData.quality_assessment.quality)}`}>
                    <h4 className={`font-semibold ${getQualityColor(speedData.quality_assessment.quality)} mb-2`}>
                      Connection Analysis
                    </h4>
                    
                    {Array.isArray(speedData.quality_assessment.issues) && speedData.quality_assessment.issues.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-400 mb-1">Issues detected:</p>
                        <ul className="text-xs text-red-300 space-y-1">
                          {speedData.quality_assessment.issues.map((issue, index) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {speedData.quality_assessment.should_contact_support === true && (
                      <button
                        onClick={() => setShowSupportModal(true)}
                        className="w-full mt-3 bg-red-600/20 text-red-400 border border-red-600/30 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                      >
                        Contact Support for Assistance
                      </button>
                    )}
                  </div>
                )}

                <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700/50">
                  {speedData.timestamp || 'No timestamp available'}
                  {speedData.public_ip && (
                    <div className="text-xs text-gray-500 mt-1">
                      Public IP: {speedData.public_ip}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 sm:mb-0">
              Test History
            </h2>
            <button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
              onClick={toggleHistory}
            >
              {showHistory ? "Hide History" : "Show History"}
            </button>
          </div>

          {showHistory && Array.isArray(history) && history.length > 0 && (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="hidden sm:grid sm:grid-cols-4 gap-4 p-4 bg-gray-700/30 rounded-xl mb-4 font-medium text-gray-300">
                  <div>Ping (ms)</div>
                  <div>Download (Mbps)</div>
                  <div>Upload (Mbps)</div>
                  <div>Timestamp</div>
                </div>
                
                <div className="space-y-3">
                  {history.map((entry, index) => (
                    <div key={index} className="bg-gray-700/20 rounded-xl p-4 border border-gray-600/20 hover:bg-gray-700/30 transition-colors">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="flex sm:block justify-between sm:justify-start">
                          <span className="text-gray-400 text-sm sm:hidden">Ping:</span>
                          <span className="text-yellow-400 font-medium">
                            {typeof entry.ping === 'number' ? entry.ping : 'N/A'} ms
                          </span>
                        </div>
                        <div className="flex sm:block justify-between sm:justify-start">
                          <span className="text-gray-400 text-sm sm:hidden">Download:</span>
                          <span className="text-green-400 font-medium">
                            {typeof entry.download_speed === 'number' ? entry.download_speed.toFixed(2) : 'N/A'} Mbps
                          </span>
                        </div>
                        <div className="flex sm:block justify-between sm:justify-start">
                          <span className="text-gray-400 text-sm sm:hidden">Upload:</span>
                          <span className="text-blue-400 font-medium">
                            {typeof entry.upload_speed === 'number' ? entry.upload_speed.toFixed(2) : 'N/A'} Mbps'
                            </span>
                        </div>
                        <div className="flex sm:block justify-between sm:justify-start">
                          <span className="text-gray-400 text-sm sm:hidden">Time:</span>
                          <span className="text-gray-400 text-sm">{entry.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showHistory && history.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-400 text-lg">No test history available yet</p>
              <p className="text-gray-500 text-sm mt-2">Run your first speed test to see results here</p>
            </div>
          )}
        </div>

        {/* Support Modal */}
        <SupportModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          ispInfo={currentIsp}
          qualityAssessment={speedData?.quality_assessment}
        />
      </div>
    </div>
  );
}