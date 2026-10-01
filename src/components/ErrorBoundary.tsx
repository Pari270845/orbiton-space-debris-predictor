import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Orbiton:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060b17] flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#091122] border border-[#223558] shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold font-telemetry tracking-wide text-slate-100 uppercase">
              FLIGHT SYSTEM RECOVERY
            </h1>
            <p className="text-xs text-slate-400 font-telemetry">
              A flight dynamics telemetry render exception occurred. The system has prevented crash progression.
            </p>
            {this.state.error && (
              <div className="p-3 rounded-lg bg-[#04070e] border border-slate-800 text-[11px] font-mono text-amber-400/90 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-telemetry tracking-wider uppercase transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESTART TELEMETRY ENGINE</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
