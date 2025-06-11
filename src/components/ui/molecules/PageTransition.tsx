import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'modal';
}

// Apple-style easing curves
const appleEasing = [0.25, 0.1, 0.25, 1];
const appleEasingOut = [0.16, 1, 0.3, 1];

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'default'
}) => {
  const variants = {
    default: {
      initial: {
        opacity: 0,
        y: 12,
        scale: 0.98
      },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1
      },
      exit: {
        opacity: 0,
        y: -12,
        scale: 0.98
      }
    },
    subtle: {
      initial: {
        opacity: 0,
        y: 6
      },
      animate: {
        opacity: 1,
        y: 0
      },
      exit: {
        opacity: 0,
        y: -6
      }
    },
    modal: {
      initial: {
        opacity: 0,
        scale: 0.95,
        y: 20
      },
      animate: {
        opacity: 1,
        scale: 1,
        y: 0
      },
      exit: {
        opacity: 0,
        scale: 0.95,
        y: 20
      }
    }
  };

  const currentVariant = variants[variant];

  return (
    <motion.div
      initial={currentVariant.initial}
      animate={currentVariant.animate}
      exit={currentVariant.exit}
      transition={{
        duration: 0.35,
        ease: appleEasingOut,
        opacity: { duration: 0.25, ease: appleEasing },
        scale: { duration: 0.35, ease: appleEasingOut },
        y: { duration: 0.35, ease: appleEasingOut }
      }}
      style={{
        width: '100%',
        height: '100%',
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;