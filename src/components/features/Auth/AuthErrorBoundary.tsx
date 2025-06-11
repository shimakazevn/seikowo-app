import React, { Component, ReactNode } from 'react';
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  VStack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p={8} maxW="md" mx="auto" mt={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Lỗi xác thực!</AlertTitle>
              <AlertDescription>
                Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.
              </AlertDescription>
            </Box>
          </Alert>
          
          <VStack spacing={4} mt={4}>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              {this.state.error?.message || 'Lỗi không xác định'}
            </Text>
            
            <Button 
              colorScheme="blue" 
              onClick={this.handleRetry}
              size="sm"
            >
              Thử lại
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
