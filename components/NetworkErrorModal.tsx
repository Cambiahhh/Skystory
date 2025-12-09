
import React from 'react';
import { WifiOff, RotateCcw, ArrowRightLeft, X } from 'lucide-react';
import { AppLanguage } from '../types';

interface NetworkErrorModalProps {
    onSwitch: () => void;
    onRetry: () => void;
    onClose: () => void;
    lang: AppLanguage;
    isGlobalMode: boolean;
}

const NetworkErrorModal: React.FC<NetworkErrorModalProps> = ({ onSwitch, onRetry, onClose, lang, isGlobalMode }) => {
    
    const text = {
        [AppLanguage.EN]: {
            title: "Connection Failed",
            desc: isGlobalMode 
                ? "Global network (Gemini) is unresponsive. This usually requires a stable VPN." 
                : "Network request timed out.",
            switchBtn: "Switch to China Mode",
            retryBtn: "Retry Current",
            cancel: "Cancel"
        },
        [AppLanguage.CN]: {
            title: "连接超时",
            desc: isGlobalMode 
                ? "海外线路 (Gemini) 无响应。请检查您的网络连接或 VPN 设置。" 
                : "网络请求超时，请检查您的网络连接。",
            switchBtn: "切换回国内模式 (CN)",
            retryBtn: "重试当前线路",
            cancel: "取消"
        }
    }[lang];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-[#1a1a1a] border border-red-500/30 p-8 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-300">
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
              >
                  <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2 border border-red-500/20">
                      <WifiOff size={28} />
                  </div>
                  
                  <h3 className="text-white font-serif-display tracking-widest uppercase text-xl">
                      {text.title}
                  </h3>
                  
                  <p className="text-white/60 text-sm leading-relaxed mb-4">
                      {text.desc}
                  </p>

                  <div className="flex flex-col gap-3 w-full">
                      {isGlobalMode && (
                          <button 
                            onClick={onSwitch}
                            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                          >
                              <ArrowRightLeft size={16} />
                              {text.switchBtn}
                          </button>
                      )}

                      <button 
                        onClick={onRetry}
                        className={`w-full py-4 rounded-xl text-white text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-2 ${
                             isGlobalMode 
                             ? 'bg-white/10 hover:bg-white/20 text-white/80' 
                             : 'bg-white hover:bg-gray-200 text-black shadow-lg shadow-white/10'
                        }`}
                      >
                          <RotateCcw size={16} />
                          {text.retryBtn}
                      </button>
                  </div>
              </div>
           </div>
        </div>
    );
};

export default NetworkErrorModal;
