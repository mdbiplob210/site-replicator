import { useState, useEffect } from "react";

interface ExitDiscountBannerProps {
  onAccept: () => void;
  onReject: () => void;
  discountAmount?: number;
  timerSeconds?: number;
  message?: string;
}

export function ExitDiscountBanner({ 
  onAccept, 
  onReject, 
  discountAmount = 50, 
  timerSeconds = 300,
  message = "This discount is only for you!"
}: ExitDiscountBannerProps) {
  const [timeLeft, setTimeLeft] = useState(timerSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onReject} />
      <div className="relative w-[90%] max-w-sm animate-in zoom-in-95 duration-300">
        <button onClick={onReject} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-gray-500 text-lg font-bold">✕</span>
        </button>
        <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-3xl p-1 shadow-2xl">
          <div className="bg-white rounded-[22px] overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-2.5 px-4">
              <p className="text-xs font-bold tracking-wide uppercase animate-pulse">⚡ Special Offer — Only For You! ⚡</p>
            </div>
            <div className="p-6 text-center">
              {/* Countdown Timer */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="bg-gray-900 text-white rounded-lg px-3 py-2 min-w-[3.5rem]">
                  <span className="text-2xl font-black tabular-nums">{String(minutes).padStart(2, "0")}</span>
                  <p className="text-[9px] text-gray-400 uppercase">Minutes</p>
                </div>
                <span className="text-2xl font-black text-gray-900 animate-pulse">:</span>
                <div className="bg-gray-900 text-white rounded-lg px-3 py-2 min-w-[3.5rem]">
                  <span className="text-2xl font-black tabular-nums">{String(seconds).padStart(2, "0")}</span>
                  <p className="text-[9px] text-gray-400 uppercase">Seconds</p>
                </div>
              </div>

              <div className="relative inline-block mb-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                  <div className="text-white">
                    <span className="text-3xl font-black block leading-none">৳{discountAmount}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Off!</span>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-xs">🎁</span>
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-1">{message}</h3>
              <p className="text-sm text-gray-500 mb-1">Order today and get</p>
              <p className="text-2xl font-black text-red-500 mb-3">৳{discountAmount} discount!</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 mb-4">
                <p className="text-xs text-yellow-700 font-semibold">⏰ This offer ends in {minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`}!</p>
              </div>
              <button onClick={onAccept} className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-base shadow-lg shadow-green-200 transition-all transform hover:scale-[1.02] active:scale-95">
                🎉 Order with ৳{discountAmount} discount
              </button>
              <button onClick={onReject} className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition">
                No thanks, skip discount
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
