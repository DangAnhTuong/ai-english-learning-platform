import React, { useState, useEffect } from 'react';

/**
 * CloudServerWarmupNotifier
 * Monitors free-tier cloud backend spin-up (~30s Render cold-start)
 * and displays an elegant, non-intrusive status notification banner to users/recruiters.
 */
const CloudServerWarmupNotifier = () => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'warming' | 'ready' | 'dismissed'
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    let isMounted = true;
    let timerInterval = null;

    const nodeApiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
    const pythonApiUrl = (process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000').replace(/\/$/, '');

    // Threshold timer: If servers haven't answered in 1.2s, they are likely spinning up
    const spinUpTimer = setTimeout(() => {
      if (isMounted && status === 'checking') {
        setStatus('warming');
        timerInterval = setInterval(() => {
          setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 1));
        }, 1000);
      }
    }, 1200);

    const checkServer = async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        const res = await fetch(`${url}/health`, {
          method: 'GET',
          signal: controller.signal,
          mode: 'cors',
        }).catch(() => null);
        clearTimeout(timeoutId);
        return res && (res.status === 200 || res.status === 404 || res.status === 204);
      } catch {
        return false;
      }
    };

    const runHealthCheck = async () => {
      try {
        // Attempt pinging Node and Python backends
        await Promise.race([
          checkServer(nodeApiUrl),
          checkServer(pythonApiUrl),
        ]);

        clearTimeout(spinUpTimer);
        if (timerInterval) clearInterval(timerInterval);

        if (isMounted) {
          setStatus((prev) => {
            if (prev === 'warming') {
              // Was warming up, show success then auto-dismiss
              setTimeout(() => {
                if (isMounted) setStatus('dismissed');
              }, 2500);
              return 'ready';
            }
            return 'dismissed';
          });
        }
      } catch {
        // Silent fallback
      }
    };

    runHealthCheck();

    return () => {
      isMounted = false;
      clearTimeout(spinUpTimer);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  if (status === 'dismissed' || status === 'checking') {
    return null;
  }

  const isReady = status === 'ready';

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        maxWidth: '520px',
        width: 'calc(100% - 32px)',
        pointerEvents: 'auto',
        animation: 'fadeInSlideDown 0.4s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes fadeInSlideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.2), 0 8px 32px rgba(0, 0, 0, 0.4); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.45), 0 8px 32px rgba(0, 0, 0, 0.6); }
        }
      `}</style>
      <div
        style={{
          background: isReady
            ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(15, 23, 42, 0.95))'
            : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          backdropFilter: 'blur(16px)',
          border: isReady ? '1px solid #10b981' : '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '16px',
          padding: '14px 18px',
          color: '#f8fafc',
          boxShadow: isReady
            ? '0 0 25px rgba(16, 185, 129, 0.4), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 8px 32px rgba(0,0,0,0.5), 0 0 15px rgba(59, 130, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '20px',
                display: 'inline-block',
                animation: isReady ? 'none' : 'spinSlow 4s linear infinite',
              }}
            >
              {isReady ? '✅' : '🚀'}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.2px' }}>
                {isReady
                  ? 'Máy chủ đám mây đã sẵn sàng!'
                  : `Khởi động Cloud Server (~${secondsLeft}s)`}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.3 }}>
                {isReady
                  ? 'Cloud backend đã kích hoạt thành công. Đang tải dữ liệu...'
                  : 'Hạ tầng Free Cloud (Render) đang tự động đánh thức từ chế độ ngủ đông (~30s).'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setStatus('dismissed')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
            title="Đóng thông báo"
          >
            ×
          </button>
        </div>

        {!isReady && (
          <div
            style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              overflow: 'hidden',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, ((30 - secondsLeft) / 30) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                borderRadius: '999px',
                transition: 'width 1s linear',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudServerWarmupNotifier;
