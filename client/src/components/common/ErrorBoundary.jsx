import React from 'react';

/**
 * Production-grade ErrorBoundary.
 * Wraps the entire App tree so any uncaught component crash shows a friendly
 * UI instead of a white blank screen.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log to console for debugging — in production this could be sent to a monitoring service
        console.error('[ErrorBoundary] Caught a component crash:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    padding: '24px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '48px 40px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        maxWidth: '480px',
                        width: '100%',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ fontSize: '52px', marginBottom: '16px' }}>⚠️</div>
                        <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
                            An unexpected error occurred on this page. Your data is safe. Please try reloading.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '20px',
                                textAlign: 'left',
                                fontSize: '12px',
                                color: '#dc2626',
                                maxHeight: '140px',
                                overflowY: 'auto'
                            }}>
                                <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '6px' }}>
                                    Error details (dev only)
                                </summary>
                                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '10px 28px',
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={e => e.target.style.background = '#1d4ed8'}
                                onMouseOut={e => e.target.style.background = '#2563eb'}
                            >
                                🔄 Reload Page
                            </button>
                            <button
                                onClick={() => { window.location.href = '/login'; }}
                                style={{
                                    padding: '10px 24px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
