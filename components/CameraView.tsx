
import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, SwitchCamera } from 'lucide-react';
import { SkyMode } from '../types';

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
  
  // Camera Device State
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  useEffect(() => {
    // Start with default logic
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (deviceId?: string) => {
    // Ensure existing stream is stopped before starting a new one
    stopCamera();

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
        setCameraActive(true);
      }

      // Once permission is granted, enumerate devices to find multiple lenses
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);

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

  const handleSwitchCamera = () => {
    if (devices.length < 2) return;
    
    const nextIndex = (currentDeviceIndex + 1) % devices.length;
    setCurrentDeviceIndex(nextIndex);
    
    const nextDeviceId = devices[nextIndex].deviceId;
    startCamera(nextDeviceId);
  };

  // Helper to resize image to max 1024px to prevent API timeouts and memory issues
  const processAndResizeImage = (source: HTMLVideoElement | HTMLImageElement): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1024;
      let width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
      let height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

      // Calculate scale to fit max size while maintaining aspect ratio
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
      }, 'image/jpeg', 0.85); // Compress slightly to 0.85
    });
  };

  const handleCapture = async () => {
    if (videoRef.current) {
      const file = await processAndResizeImage(videoRef.current);
      onImageSelected(file);
    } else {
        fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Load file into an image element to resize it
      const img = new Image();
      img.onload = async () => {
        const resizedFile = await processAndResizeImage(img);
        onImageSelected(resizedFile);
        // Clean up
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
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

      {/* No Star Overlay anymore */}

      <canvas ref={canvasRef} className="hidden" />
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none">
        
        {/* Top Bar - Pointer events auto to allow clicks */}
        <div className="w-full flex justify-between items-start pointer-events-auto">
            <button onClick={onBack} className="p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 backdrop-blur-sm transition">
                <ArrowLeft size={24} />
            </button>
            
            {/* Camera Switcher (Only visible if multiple cameras found) */}
            {devices.length > 1 && (
              <button 
                onClick={handleSwitchCamera}
                className="p-2 rounded-full bg-black/20 text-white/70 hover:bg-black/40 backdrop-blur-sm transition"
              >
                <SwitchCamera size={24} />
              </button>
            )}

            {/* Corners */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-white/60 pointer-events-none opacity-50"></div>
            <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-white/60 pointer-events-none opacity-50"></div>
        </div>

        {/* Center: Clean view */}

        {/* Bottom Bar - Pointer events auto */}
        <div className="w-full relative flex flex-col items-center pointer-events-auto">
            
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
