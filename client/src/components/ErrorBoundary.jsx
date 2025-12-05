import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                    <div className="glass-card p-8 rounded-2xl shadow-2xl max-w-2xl w-full bg-slate-950 border-white/10">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Algo deu errado.</h1>
                        <p className="text-slate-400 mb-4">Ocorreu um erro inesperado na aplicação.</p>
                        <div className="bg-slate-900 p-4 rounded-xl overflow-auto max-h-96 text-xs font-mono text-slate-300 border border-slate-800">
                            <p className="font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-6 btn-primary"
                        >
                            Voltar para o Início
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
