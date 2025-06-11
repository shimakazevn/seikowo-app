import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  useColorMode,
  useColorModeValue,
  Flex,
  Icon,
  Tooltip,
  Badge
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSearch, FaHeart, FaStar } from 'react-icons/fa';
import { MdRefresh } from 'react-icons/md';

const MotionBox = motion(Box);
const MotionText = motion(Text);

// Cute anime girl ASCII art alternatives (using emojis for simplicity)
const animeCharacters = [
  '(｡◕‿◕｡)',
  '(´｡• ᵕ •｡`)',
  '(◕‿◕)♡',
  '(｡♥‿♥｡)',
  '(◡ ‿ ◡)',
  '(✿◠‿◠)',
  '(◕‿◕)✨'
];

const wibuQuotes = [
  "Ara ara~ Trang này đã biến mất rồi! (◕‿◕)♡",
  "Gomen nasai! Không tìm thấy trang này desu~ (｡◕‿◕｡)",
  "Nani?! Trang 404 xuất hiện rồi! Σ(°ロ°)",
  "Yamete kudasai! Link này không tồn tại! (>_<)",
  "Sumimasen~ Trang này đã đi đâu mất rồi? (´｡• ᵕ •｡`)",
  "Ehhhh?! Trang này không có desu yo! (◉_◉)",
  "Mou~ Trang này đã biến mất như ninja vậy! ٩(◕‿◕)۶",
  "Senpai~ Bạn đã lạc đường rồi! (✿◠‿◠)",
  "Kyaa~ Trang này đã isekai rồi! ✨(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
  "Onii-chan~ Link này bị curse rồi! (╯°□°）╯"
];

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentCharacter, setCurrentCharacter] = useState(0);
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number}>>([]);

  const isDark = colorMode === 'dark';
  
  // Colors
  const bgGradient = useColorModeValue(
    'linear(to-br, pink.50, purple.50, blue.50)',
    'linear(to-br, purple.900, pink.900, blue.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const accentColor = useColorModeValue('pink.500', 'pink.300');

  // Rotate quotes and characters
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % wibuQuotes.length);
    }, 3000);

    const characterInterval = setInterval(() => {
      setCurrentCharacter((prev) => (prev + 1) % animeCharacters.length);
    }, 2000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(characterInterval);
    };
  }, []);

  // Generate sparkles
  useEffect(() => {
    const generateSparkles = () => {
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setSparkles(newSparkles);
    };

    generateSparkles();
    const sparkleInterval = setInterval(generateSparkles, 4000);

    return () => clearInterval(sparkleInterval);
  }, []);

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      position="relative"
      overflow="hidden"
    >
      {/* Floating sparkles */}
      {sparkles.map((sparkle) => (
        <Box
          key={sparkle.id}
          position="absolute"
          left={`${sparkle.x}%`}
          top={`${sparkle.y}%`}
          style={{
            animation: 'sparkle 2s infinite'
          }}
          sx={{
            '@keyframes sparkle': {
              '0%, 100%': { opacity: 0, transform: 'scale(0)' },
              '50%': { opacity: 1, transform: 'scale(1)' }
            }
          }}
          animationDelay={`${sparkle.id * 0.3}s`}
          zIndex={1}
        >
          <Icon as={FaStar} color={accentColor} boxSize="12px" />
        </Box>
      ))}

      <Container maxW="container.lg" py={20} position="relative" zIndex={2}>
        <VStack spacing={8} align="center" textAlign="center">
          {/* Main 404 Display */}
          <MotionBox
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <Text
              fontSize={{ base: "8xl", md: "9xl" }}
              fontWeight="bold"
              bgGradient="linear(to-r, pink.400, purple.400, blue.400)"
              bgClip="text"
              textShadow="2xl"
              style={{
                animation: 'float 3s ease-in-out infinite'
              }}
              sx={{
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '50%': { transform: 'translateY(-20px) rotate(2deg)' }
                }
              }}
            >
              404
            </Text>
          </MotionBox>

          {/* Anime Character */}
          <MotionBox
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Text
              fontSize="6xl"
              style={{
                animation: 'float 2s ease-in-out infinite',
                animationDelay: '0.5s'
              }}
              sx={{
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '50%': { transform: 'translateY(-20px) rotate(2deg)' }
                }
              }}
            >
              {animeCharacters[currentCharacter]}
            </Text>
          </MotionBox>

          {/* Quote Card */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            bg={cardBg}
            p={6}
            borderRadius="2xl"
            boxShadow="xl"
            border="2px solid"
            borderColor={accentColor}
            maxW="md"
            position="relative"
          >
            {/* Cute decoration */}
            <Badge
              position="absolute"
              top="-10px"
              right="-10px"
              colorScheme="pink"
              borderRadius="full"
              px={3}
              py={1}
            >
              ✨ Kawaii ✨
            </Badge>

            <MotionText
              key={currentQuote}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              fontSize="lg"
              color={textColor}
              fontWeight="medium"
              lineHeight="tall"
            >
              {wibuQuotes[currentQuote]}
            </MotionText>
          </MotionBox>

          {/* Error Message */}
          <VStack spacing={4}>
            <Text fontSize="xl" color={textColor} maxW="md" textAlign="center">
              Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            </Text>
            <VStack spacing={2}>
              <Text fontSize="md" color="gray.500">
                でも大丈夫！ (Demo daijoubu! - Nhưng không sao!)
              </Text>
              <Text fontSize="sm" color={accentColor} fontWeight="bold">
                *poof* ✨ *magical girl transformation sound* ✨
              </Text>
            </VStack>
          </VStack>

          {/* Action Buttons */}
          <HStack spacing={4} wrap="wrap" justify="center">
            <Button
              leftIcon={<FaHome />}
              colorScheme="pink"
              size="lg"
              borderRadius="full"
              onClick={() => navigate('/')}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              transition="all 0.2s"
            >
              Về Trang Chủ
            </Button>

            <Button
              leftIcon={<FaSearch />}
              variant="outline"
              colorScheme="purple"
              size="lg"
              borderRadius="full"
              onClick={() => navigate('/search')}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg'
              }}
              transition="all 0.2s"
            >
              Tìm Kiếm
            </Button>

            <Tooltip label="Thử lại trang này">
              <Button
                leftIcon={<MdRefresh />}
                variant="ghost"
                colorScheme="blue"
                size="lg"
                borderRadius="full"
                onClick={() => window.location.reload()}
                _hover={{
                  transform: 'translateY(-2px)',
                  bg: isDark ? 'blue.800' : 'blue.50'
                }}
                transition="all 0.2s"
              >
                Thử Lại
              </Button>
            </Tooltip>
          </HStack>

          {/* Footer Message */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            textAlign="center"
          >
            <HStack justify="center" spacing={2}>
              <Icon as={FaHeart} color="pink.400" />
              <Text fontSize="sm" color="gray.500">
                Made with love for otaku community
              </Text>
              <Icon as={FaHeart} color="pink.400" />
            </HStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
