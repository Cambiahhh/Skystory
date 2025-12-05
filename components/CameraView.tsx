import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface CameraViewProps {
  onImageSelected: (file: File) => void;
  onBack: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  onImageSelected, 
  onBack
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error", err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            onImageSelected(file);
          }
        }, 'image/jpeg', 0.95);
      }
    } else {
        fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      
      {/* Live Feed Layer */}
      <div className="absolute inset-0 z-0">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover opacity-90"
        />
        {!cameraActive && (
             <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                 <div className="w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
             </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6">
        
        {/* Top Bar */}
        <div className="w-full flex justify-between items-start">
            <button onClick={onBack} className="p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 backdrop-blur-sm transition">
                <ArrowLeft size={24} />
            </button>
            
            {/* Corners */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-white/60 pointer-events-none opacity-50"></div>
            <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-white/60 pointer-events-none opacity-50"></div>
        </div>

        {/* Center: Clean view, removed artifacts */}

        {/* Bottom Bar */}
        <div className="w-full relative flex flex-col items-center">
            
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/60 pointer-events-none opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/60 pointer-events-none opacity-50"></div>

            {/* Shutter Button */}
            <div className="mb-8 relative group">
                <div className="w-20 h-20 rounded-full border border-white flex items-center justify-center">
                    <button 
                        onClick={handleCapture}
                        className="w-16 h-16 bg-white/90 rounded-full hover:bg-white active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    ></button>
                </div>
            </div>

             {/* Upload Icon */}
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-6 left-6 text-white/70 hover:text-white transition p-2"
            >
                <ImageIcon size={24} strokeWidth={1.5} />
            </button>
        </div>

      </div>
    </div>
  );
};

export default CameraView;