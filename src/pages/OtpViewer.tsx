import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// OTP entry type
interface OtpEntry {
    phone: string;
    otp: string;
    timestamp: string;
}

const OtpViewer = () => {
    // Initialize from session storage to persist data across reloads/disconnects
    const [otpList, setOtpList] = useState<OtpEntry[]>(() => {
        try {
            const saved = sessionStorage.getItem('otp_cache');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load OTPs from cache:', error);
            return [];
        }
    });
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update session storage whenever otpList changes
    useEffect(() => {
        try {
            sessionStorage.setItem('otp_cache', JSON.stringify(otpList));
        } catch (error) {
            console.error('Failed to save OTPs to cache:', error);
        }
    }, [otpList]);

    useEffect(() => {
        // Initialize Supabase client
        const supabaseUrl = "https://bdsaakhxumazaxigqchm.supabase.co";
        const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2Fha2h4dW1hemF4aWdxY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzYxMjYsImV4cCI6MjA4MzI1MjEyNn0.zlidJunY3hQDQrj2hJfvwM3GSh6wTCUwRxIh_DjhXV4";

        if (!supabaseUrl || !supabaseAnonKey) {
            setError('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
            return;
        }

        // Configure client with more aggressive keep-alive settings
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            realtime: {
                heartbeatIntervalMs: 2000, // Send heartbeats more frequently to keep connection alive
                params: {
                    eventsPerSecond: 10,
                },
            },
        });

        let channel: any = null;
        let reconnectTimer: any = null;

        const connect = () => {
            if (channel) {
                supabase.removeChannel(channel);
            }

            console.log('Attempting to connect to OTP channel...');
            channel = supabase
                .channel('otp-broadcast')
                .on('broadcast', { event: 'new-otp' }, (payload) => {
                    console.log('📱 Received OTP:', payload);
                    const otpData = payload.payload as OtpEntry;
                    setOtpList((prev) => {
                        const updated = [otpData, ...prev].slice(0, 50);
                        return updated;
                    });
                })
                .subscribe((status) => {
                    console.log('Channel status:', status);
                    if (status === 'SUBSCRIBED') {
                        setIsConnected(true);
                        setError(null);
                        if (reconnectTimer) clearTimeout(reconnectTimer);
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        setIsConnected(false);
                        setError(`Connection lost (${status}). Reconnecting...`);
                        // Try to reconnect after a short delay
                        if (!reconnectTimer) {
                            reconnectTimer = setTimeout(connect, 3000);
                        }
                    }
                });
        };

        connect();

        // Reconnect immediately when tab becomes visible or browser comes online
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('Tab visible, checking connection...');
                // If we're not explicitly connected (or just to be safe), reconnect
                connect();
            }
        };

        const handleOnline = () => {
            console.log('Browser online, reconnecting...');
            connect();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);

        // Cleanup on unmount
        return () => {
            if (channel) supabase.removeChannel(channel);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatPhone = (phone: string) => {
        // Mask middle digits for privacy
        if (phone.length > 6) {
            return phone.slice(0, 4) + '****' + phone.slice(-4);
        }
        return phone;
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                            OTP Viewer
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Real-time development feed
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`mt-4 md:mt-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 ${isConnected
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {otpList.length === 0 && isConnected && (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <span className="text-3xl text-gray-400">📨</span>
                        </div>
                        <h3 className="text-gray-900 font-medium text-lg">No OTPs received yet</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm text-center">
                            Trigger a login action in your mobile app to see verification codes tracking here in real-time.
                        </p>
                    </div>
                )}

                {/* OTP List */}
                <div className="space-y-4">
                    {otpList.map((entry, index) => (
                        <div
                            key={`${entry.phone}-${entry.timestamp}`}
                            className={`group p-5 rounded-lg border transition-all duration-200 ${index === 0
                                ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-50 z-10'
                                : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-medium text-gray-700 text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                                            {formatPhone(entry.phone)}
                                        </span>
                                        {index === 0 && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wider border border-blue-100">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-baseline gap-4 mt-3">
                                        <div className="text-3xl font-mono font-bold text-gray-900 tracking-[0.2em] select-all">
                                            {entry.otp}
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono self-end mb-1">
                                            {formatTime(entry.timestamp)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => copyToClipboard(entry.otp)}
                                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                    title="Copy to clipboard"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-400 font-medium bg-gray-50 inline-block px-3 py-1 rounded-full border border-gray-100">
                        Internal Development Tool • Do not use in production
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OtpViewer;
