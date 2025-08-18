import React from 'react';
import PropTypes from 'prop-types';
import Card from '../ui/Card';
import Button from '../ui/WButton';
import Text from '../ui/Text';

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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: 'hsl(var(--surface-primary))'
        }}>
          <Card style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                color: 'hsl(var(--wii-red))'
              }}>
                ⚠️
              </div>
              
              <Text variant="h2" style={{ 
                color: 'hsl(var(--text-primary))', 
                marginBottom: '12px' 
              }}>
                Something went wrong
              </Text>
              
              <Text variant="body" style={{ 
                color: 'hsl(var(--text-secondary))', 
                marginBottom: '24px' 
              }}>
                An unexpected error occurred. The app has been prevented from crashing.
              </Text>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details style={{ 
                  marginBottom: '24px',
                  textAlign: 'left',
                  background: 'hsl(var(--surface-secondary))',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border-primary))'
                }}>
                  <summary style={{ 
                    cursor: 'pointer',
                    color: 'hsl(var(--text-primary))',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    Error Details (Development)
                  </summary>
                  <pre style={{ 
                    fontSize: '12px',
                    color: 'hsl(var(--text-secondary))',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: '0'
                  }}>
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Button 
                  variant="primary" 
                  onClick={this.handleRetry}
                  style={{ minWidth: '120px' }}
                >
                  Try Again
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={this.handleReportError}
                  style={{ minWidth: '120px' }}
                >
                  Report Error
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={() => window.location.reload()}
                  style={{ minWidth: '120px' }}
                >
                  Reload App
                </Button>
              </div>

              {this.state.errorId && (
                <Text variant="caption" style={{ 
                  color: 'hsl(var(--text-tertiary))', 
                  marginTop: '16px',
                  display: 'block'
                }}>
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
