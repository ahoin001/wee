import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';
import Button from '../ui/WButton';
import Text from '../ui/Text';
import '../styles/error-ui.css';

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

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and any error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In a production app, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
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
    // In a real app, this would open a bug report form or send to error tracking
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
    
    // For now, just show an alert
    alert(`Error reported with ID: ${this.state.errorId}\n\nPlease include this ID when reporting the issue.`);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-fullpage">
          <Card className="app-error-card-shell">
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

              {process.env.NODE_ENV === 'development' && this.state.error && (
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
          </Card>
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
