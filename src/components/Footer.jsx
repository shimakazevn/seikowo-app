import React from 'react';
import { Link } from 'react-router-dom';
import { useColorModeValue, Box, HStack, Text, Icon } from '@chakra-ui/react';

const Footer = () => {
  const color = useColorModeValue('gray.600', 'gray.400');
  const linkHover = useColorModeValue('brand.600', 'brand.300');

  return (
    <Box
      as="footer"
      w="full"
      py={2}
      px={2}
      color={color}
      textAlign="center"
      fontSize="sm"
      mt={4}
    >
 
      <Text fontSize="xs" color={useColorModeValue('gray.400', 'gray.500')} mb={1}>
      Dịch vì đam mê, vui chơi là chính.
      </Text>
      <HStack justify="center" spacing={2} flexWrap="wrap">
        <Link
          to="/privacy-policy"
          style={{ textDecoration: 'underline' }}
          className="footer-link"
        >
          Chính sách quyền riêng tư
        </Link>
        <Text as="span">|</Text>
        <Link
          to="/terms-of-service"
          style={{ textDecoration: 'underline' }}
          className="footer-link"
        >
          Điều khoản dịch vụ
        </Link>
      </HStack>
      <style>{`
        .footer-link {
          color: inherit;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: ${linkHover};
        }
      `}</style>
    </Box>
  );
};

export default Footer;
