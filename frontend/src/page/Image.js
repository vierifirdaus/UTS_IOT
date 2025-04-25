import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function ImagePage() {
  const { id } = useParams();
  const [imageInfo, setImageInfo] = useState(null);
  const [requestLatency, setRequestLatency] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImageData = async () => {
      const start = performance.now();
      
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/image/${id}`);
        const end = performance.now();
        
        setRequestLatency(end - start);
        setImageInfo({
          ...response.data,
          request_latency: end - start,
          end_to_end_latency: (response.data.capture_time || 0) + 
                             (response.data.publish_time || 0) + 
                             (response.data.latency_db || 0) +
                             (end - start)
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch image data");
        setLoading(false);
      }
    };

    fetchImageData();
  }, [id]);

  const handleDownload = () => {
    window.open(`${process.env.REACT_APP_BACKEND_URL}/images/decrypt/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Image Details - ID: {id}</h1>
        <button
          onClick={handleDownload}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download Image
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Display */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Image Preview</h2>
            <button
              onClick={handleDownload}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download
            </button>
          </div>
          <img
            src={`data:image/jpeg;base64,${imageInfo.image}`}
            alt="Decrypted Image"
            className="w-full h-auto rounded-md shadow-sm"
          />
        </div>
        
        {/* Latency Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-700">Device Latencies</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-500">Capture Time</p>
                  <p className="font-mono">{imageInfo.capture_time.toFixed(2)} ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Publish Time</p>
                  <p className="font-mono">{imageInfo.publish_time.toFixed(2)} ms</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-700">System Latencies</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-500">Database Processing</p>
                  <p className="font-mono">{imageInfo.latency_db.toFixed(2)} ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">API Request</p>
                  <p className="font-mono">{requestLatency.toFixed(2)} ms</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
              <h3 className="font-medium text-blue-700">End-to-End Latency</h3>
              <p className="text-2xl font-mono mt-2 text-blue-600">
                {imageInfo.end_to_end_latency.toFixed(2)} ms
              </p>
              <p className="text-sm text-gray-500 mt-1">
                (Capture + Publish + DB + Request)
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-700">Timestamp</h3>
              <p className="font-mono text-sm mt-1">
                {new Date(imageInfo.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImagePage;