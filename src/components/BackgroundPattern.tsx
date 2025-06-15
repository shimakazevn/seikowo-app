import React, { memo } from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const float1 = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-30px) rotate(120deg); }
  66% { transform: translateY(30px) rotate(240deg); }
`;

const float2 = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
`;

const float3 = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(15px) rotate(90deg); }
  75% { transform: translateY(-15px) rotate(270deg); }
`;

interface BackgroundPatternProps {
  variant?: 'dots' | 'geometric' | 'waves';
  opacity?: number;
}

const BackgroundPattern: React.FC<BackgroundPatternProps> = memo(({
  variant = 'dots',
  opacity = 0.05
}) => {
  const patternColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('gray.200', 'gray.700');
  const tertiaryColor = useColorModeValue('gray.200', 'gray.700');

  if (variant === 'dots') {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={opacity}
        pointerEvents="none"
        overflow="hidden"
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <Box
            key={i}
            position="absolute"
            width="4px"
            height="4px"
            bg={i % 3 === 0 ? patternColor : i % 3 === 1 ? accentColor : tertiaryColor}
            borderRadius="full"
            top={`${Math.random() * 100}%`}
            left={`${Math.random() * 100}%`}
            animation={`${float1} ${3 + Math.random() * 2}s ease-in-out infinite`}
            sx={{
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </Box>
    );
  }

  if (variant === 'waves') {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={opacity}
        pointerEvents="none"
        overflow="hidden"
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
        >
          <path
            d="M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z"
            fill={patternColor}
            opacity={0.3}
          />
          <path
            d="M0,500 Q400,300 800,500 T1200,500 L1200,800 L0,800 Z"
            fill={accentColor}
            opacity={0.2}
          />
        </svg>
      </Box>
    );
  }

  // Geometric pattern (default)
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      opacity={opacity}
      pointerEvents="none"
      overflow="hidden"
    >
      {/* Floating geometric shapes */}
      <Box
        position="absolute"
        top="10%"
        right="10%"
        width="80px"
        height="80px"
        bg={patternColor}
        borderRadius="lg"
        transform="rotate(45deg)"
        animation={`${float1} 6s ease-in-out infinite`}
      />

      <Box
        position="absolute"
        top="60%"
        left="15%"
        width="60px"
        height="60px"
        bg={accentColor}
        borderRadius="full"
        animation={`${float2} 4s ease-in-out infinite`}
      />

      <Box
        position="absolute"
        bottom="20%"
        right="20%"
        width="100px"
        height="100px"
        bg={tertiaryColor}
        clipPath="polygon(50% 0%, 0% 100%, 100% 100%)"
        animation={`${float3} 5s ease-in-out infinite`}
      />

      <Box
        position="absolute"
        top="30%"
        left="5%"
        width="40px"
        height="40px"
        bg={patternColor}
        transform="rotate(45deg)"
        animation={`${float2} 3s ease-in-out infinite`}
        sx={{
          animationDelay: "1s"
        }}
      />

      <Box
        position="absolute"
        bottom="40%"
        left="70%"
        width="70px"
        height="70px"
        bg={accentColor}
        borderRadius="lg"
        animation={`${float1} 4.5s ease-in-out infinite`}
        sx={{
          animationDelay: "2s"
        }}
      />

      {/* Grid pattern overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundImage={`
          linear-gradient(${patternColor} 1px, transparent 1px),
          linear-gradient(90deg, ${patternColor} 1px, transparent 1px)
        `}
        backgroundSize="50px 50px"
        opacity={0.1}
      />
    </Box>
  );
});

BackgroundPattern.displayName = 'BackgroundPattern';

export default BackgroundPattern;
