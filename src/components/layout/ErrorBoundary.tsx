import React, { Component, ErrorInfo } from 'react';
import { Box, Heading, Text, Button, VStack, Center, Icon } from '@chakra-ui/react';
import { BiError } from 'react-icons/bi';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center h="50vh">
          <VStack spacing={4} textAlign="center" px={4}>
            <Icon as={BiError} w={12} h={12} color="red.500" />
            <Heading size="lg">Something went wrong</Heading>
            <Text color="gray.600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <Button
              colorScheme="blue"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Try again
            </Button>
          </VStack>
        </Center>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
