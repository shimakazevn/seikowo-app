import { Modal, ModalOverlay, ModalContent, ModalProps } from '@chakra-ui/react';
import React from 'react';

interface AppModalProps extends ModalProps {
  contentMaxW?: string | object;
  contentP?: number | object;
  contentBorderRadius?: string | number | object;
  contentBoxShadow?: string;
  contentM?: number | object;
  contentMaxH?: string | object;
  contentBorder?: string;
  contentBg?: string;
}

export function AppModal({ children, contentMaxW = "540px", contentP = 2, contentBorderRadius = "2xl", contentBoxShadow = "lg", contentM, contentMaxH, contentBorder = "none", contentBg, ...props }: AppModalProps) {
  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent
        bg={contentBg || "#131313"}
        borderRadius={contentBorderRadius}
        boxShadow={contentBoxShadow}
        p={contentP}
        maxW={contentMaxW}
        m={contentM}
        maxH={contentMaxH}
        border={contentBorder}
      >
        {children}
      </ModalContent>
    </Modal>
  );
} 