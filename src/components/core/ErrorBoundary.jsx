import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/WButton';
import { WeeCard } from '../../ui/wee';
import Text from '../../ui/Text';
import '../../styles/error-ui.css';
import { IS_DEV } from '../../utils/env';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    try {
      const payload = {
        errorId: this.state.errorId,
        message: error?.message || String(error),
        stack: error?.stack || null,
        componentStack: errorInfo?.componentStack || null,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('wee:lastErrorBoundary', JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.log('Error Report:', errorReport);

    const message = this.state.error?.message || this.state.error?.toString() || 'Unknown error';
    const short = message.length > 280 ? `${message.slice(0, 277)}…` : message;
    alert(
      `Error reported with ID: ${this.state.errorId}\n\n${short}\n\nPlease include this ID when reporting the issue.`
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-fullpage">
          <WeeCard className="app-error-card-shell">
            <div className="app-error-card-inner">
              <div className="app-error-emoji">
                ⚠️
              </div>
              
              <Text variant="h2" className="mb-3 text-[hsl(var(--text-primary))]">
                Something went wrong
              </Text>
              
              <Text variant="body" className="mb-6 text-[hsl(var(--text-secondary))]">
                An unexpected error occurred. The app has been prevented from crashing.
              </Text>

              {IS_DEV && this.state.error && (
                <details className="app-error-details">
                  <summary>
                    Error Details (Development)
                  </summary>
                  <pre className="app-error-pre">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="app-error-actions">
                <Button 
                  variant="primary" 
                  onClick={this.handleRetry}
                  className="app-error-btn-wide"
                >
                  Try Again
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={this.handleReportError}
                  className="app-error-btn-wide"
                >
                  Report Error
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={() => window.location.reload()}
                  className="app-error-btn-wide"
                >
                  Reload App
                </Button>
              </div>

              {this.state.errorId && (
                <Text variant="caption" className="app-error-caption">
                  Error ID: {this.state.errorId}
                </Text>
              )}
            </div>
          </WeeCard>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  onError: PropTypes.func
};

export default ErrorBoundary;
