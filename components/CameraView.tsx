
import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, SwitchCamera, Cloud, Leaf, Camera, Loader2 } from 'lucide-react';
import { SkyMode, NatureDomain } from '../types';
import { useSmartMode } from '../hooks/useSmartMode';

interface CameraViewProps {
  onImageSelected: (file: File) => void;
  onBack: () => void;
  mode?: SkyMode; 
}

const CameraView: React.FC<CameraViewProps> = ({ 
  onImageSelected, 
  onBack,
  mode = SkyMode.CLOUD
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Smart Mode Logic
  const { domain, debugBeta } = useSmartMode();

  // Camera Device State
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setIsLoading(true);
    setPermissionDenied(false);
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: 'environment' },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to actually start playing to avoid black flash
        videoRef.current.onloadedmetadata = () => {
            setCameraActive(true);
            setIsLoading(false);
        };
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
    } catch (err) {
      console.error("Camera error", err);
      setCameraActive(false);
      setPermissionDenied(true);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleSwitchCamera = () => {
    if (devices.length < 2) return;
    const nextIndex = (currentDeviceIndex + 1) % devices.length;
    setCurrentDeviceIndex(nextIndex);
    startCamera(devices[nextIndex].deviceId);
  };

  const processAndResizeImage = (source: HTMLVideoElement | HTMLImageElement): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1024;
      let width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      let height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(source, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          resolve(file);
        }
      }, 'image/jpeg', 0.85);
    });
  };

  const handleCapture = async () => {
    // Only try to capture from video if the stream is actively running
    if (cameraActive && videoRef.current) {
      const file = await processAndResizeImage(videoRef.current);
      onImageSelected(file);
    } else {
        // Fallback to system camera / file picker
        fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = async () => {
        const resizedFile = await processAndResizeImage(img);
        onImageSelected(resizedFile);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  // --- Theme Styles based on Domain ---
  const isSky = domain === NatureDomain.SKY;
  const accentColor = isSky ? 'text-cyan-200 border-cyan-200/50' : 'text-emerald-200 border-emerald-200/50';
  const gridColor = isSky ? 'border-white/20' : 'border-emerald-100/20';
  const badgeBg = isSky ? 'bg-cyan-900/30 text-cyan-100' : 'bg-emerald-900/30 text-emerald-100';

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      
      {/* Live Feed Layer */}
      <div className="absolute inset-0 z-0">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover transition-opacity duration-700 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Fallback / Error UI */}
        {!cameraActive && !isLoading && (
             <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                 <div className={`w-64 h-64 rounded-full blur-3xl animate-pulse absolute ${isSky ? 'bg-cyan-500/20' : 'bg-emerald-500/20'}`}></div>
                 
                 <div className="relative z-10 flex flex-col items-center gap-4">
                    <p className="text-white/50 text-sm font-serif-text tracking-wider">
                        {permissionDenied ? "Camera Access Denied" : "Camera unavailable"}
                    </p>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all backdrop-blur-md"
                    >
                        <Camera size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Open System Camera</span>
                    </button>
                 </div>
             </div>
        )}

        {/* Loading Spinner (Hidden if active or error shown) */}
        {isLoading && (
            <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
                <Loader2 size={32} className="text-white/20 animate-spin" />
            </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      {/* capture="environment" hints the browser to use the rear camera directly */}
      <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* --- Smart Lens UI Overlay --- */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none">
        
        {/* Top Bar */}
        <div className="w-full flex justify-between items-start pointer-events-auto">
            <button onClick={onBack} className="p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 backdrop-blur-sm transition">
                <ArrowLeft size={24} />
            </button>
            
            {/* Smart Mode Indicator */}
            <div className={`px-4 py-2 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 transition-all duration-500 ${badgeBg}`}>
                {isSky ? <Cloud size={14} className="animate-in fade-in zoom-in" /> : <Leaf size={14} className="animate-in fade-in zoom-in" />}
                <span className="text-[10px] font-bold tracking-widest uppercase w-12 text-center">
                    {isSky ? 'SKY' : 'LAND'}
                </span>
            </div>

            {devices.length > 1 && cameraActive && (
              <button onClick={handleSwitchCamera} className="p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 backdrop-blur-sm transition">
                <SwitchCamera size={24} />
              </button>
            )}
        </div>

        {/* Dynamic Grid Overlay - Only show if camera is active to avoid cluttering the fallback UI */}
        {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                {/* Rule of Thirds - Horizontal */}
                <div className={`absolute top-1/3 left-6 right-6 h-[1px] transition-colors duration-700 ${gridColor}`}></div>
                <div className={`absolute top-2/3 left-6 right-6 h-[1px] transition-colors duration-700 ${gridColor}`}></div>
                {/* Rule of Thirds - Vertical */}
                <div className={`absolute left-1/3 top-24 bottom-24 w-[1px] transition-colors duration-700 ${gridColor}`}></div>
                <div className={`absolute right-1/3 top-24 bottom-24 w-[1px] transition-colors duration-700 ${gridColor}`}></div>
                
                {/* Center Focus Reticle */}
                <div className={`w-12 h-12 border transition-all duration-500 ${accentColor} opacity-80 flex items-center justify-center`}>
                    <div className={`w-1 h-1 rounded-full ${isSky ? 'bg-cyan-200' : 'bg-emerald-200'}`}></div>
                </div>
            </div>
        )}

        {/* Bottom Bar */}
        <div className="w-full relative flex flex-col items-center pointer-events-auto">
            {/* Shutter Button */}
            <div className="mb-8 relative group">
                <div className={`w-20 h-20 rounded-full border transition-colors duration-500 flex items-center justify-center ${isSky ? 'border-white' : 'border-emerald-100'}`}>
                    <button 
                        onClick={handleCapture}
                        className={`w-16 h-16 rounded-full active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] ${isSky ? 'bg-white/90 hover:bg-white' : 'bg-emerald-50/90 hover:bg-emerald-50'}`}
                    ></button>
                </div>
            </div>

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
