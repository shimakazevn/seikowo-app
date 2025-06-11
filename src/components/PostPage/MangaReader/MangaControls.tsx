import React, { memo, useEffect } from 'react';
import {
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Switch,
  Tooltip,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  VStack,
  Button,
  useBreakpointValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Box,
  Progress,
  useToast
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ViewOffIcon,
  ViewIcon,
  ExternalLinkIcon,
  SettingsIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon
} from '@chakra-ui/icons';
import BookmarkButton from '../BookmarkButton';
import { useHotkeys } from 'react-hotkeys-hook';

interface MangaControlsProps {
  // Page navigation
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageJump: (value: string) => void;
  
  // Mode controls
  isVerticalMode: boolean;
  isTwoPage: boolean;
  autoScroll: boolean;
  onModeSwitch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTwoPageSwitch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoScrollToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Settings
  autoScrollSpeed: number;
  brightness: number;
  onAutoScrollSpeedChange: (value: number) => void;
  onBrightnessChange: (value: number) => void;
  
  // Actions
  onDownload: () => void;
  onShare: () => void;
  onFullscreen: () => void;
  isDownloading: boolean;
  fullscreen: boolean;
  
  // Bookmark
  mangaData: {
    id: string;
    title: string;
    url: string;
    currentPage: number;
    totalPages: number;
    verticalMode: boolean;
  };
}

const MangaControls: React.FC<MangaControlsProps> = memo(({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onPageJump,
  isVerticalMode,
  isTwoPage,
  autoScroll,
  onModeSwitch,
  onTwoPageSwitch,
  onAutoScrollToggle,
  autoScrollSpeed,
  brightness,
  onAutoScrollSpeedChange,
  onBrightnessChange,
  onDownload,
  onShare,
  onFullscreen,
  isDownloading,
  fullscreen,
  mangaData
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();

  // Keyboard shortcuts
  useHotkeys('left', onPrevPage, [onPrevPage]);
  useHotkeys('right', onNextPage, [onNextPage]);
  useHotkeys('space', onNextPage, [onNextPage]);
  useHotkeys('shift+space', onPrevPage, [onPrevPage]);
  useHotkeys('home', () => onPageJump('1'), [onPageJump]);
  useHotkeys('end', () => onPageJump(totalPages.toString()), [onPageJump, totalPages]);
  useHotkeys('v', () => onModeSwitch({ target: { checked: !isVerticalMode } } as any), [isVerticalMode, onModeSwitch]);
  useHotkeys('t', () => onTwoPageSwitch({ target: { checked: !isTwoPage } } as any), [isTwoPage, onTwoPageSwitch]);
  useHotkeys('a', () => onAutoScrollToggle({ target: { checked: !autoScroll } } as any), [autoScroll, onAutoScrollToggle]);
  useHotkeys('f', onFullscreen, [onFullscreen]);
  useHotkeys('b', () => onBrightnessChange(brightness === 100 ? 150 : 100), [brightness, onBrightnessChange]);

  // Show keyboard shortcuts toast on first render (only once)
  useEffect(() => {
    const hasShownToast = sessionStorage.getItem('manga-shortcuts-shown');
    if (!hasShownToast) {
      toast({
        title: "Keyboard Shortcuts",
        description: "Left/Right: Navigate, Space: Next, Shift+Space: Previous, V: Vertical Mode, T: Two Page, A: Auto-scroll, F: Fullscreen, B: Brightness",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      sessionStorage.setItem('manga-shortcuts-shown', 'true');
    }
  }, [toast]);

  return (
    <VStack spacing={2} width="100%" p={2} bg={bgColor} borderBottom="1px" borderColor={borderColor}>
      {/* Progress bar */}
      <Progress 
        value={(currentPage + 1) / totalPages * 100} 
        width="100%" 
        size="sm" 
        colorScheme="blue"
        borderRadius="md"
      />

      {/* Main controls */}
      <HStack spacing={2} width="100%" justify="space-between">
        <HStack spacing={2}>
          <Tooltip label="Previous (←)">
            <IconButton
              aria-label="Previous page"
              icon={<ChevronLeftIcon />}
              onClick={onPrevPage}
              isDisabled={currentPage === 0}
              size="sm"
            />
          </Tooltip>

          <NumberInput
            value={currentPage + 1}
            min={1}
            max={totalPages}
            onChange={onPageJump}
            size="sm"
            width="70px"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>

          <Text>/ {totalPages}</Text>

          <Tooltip label="Next (→)">
            <IconButton
              aria-label="Next page"
              icon={<ChevronRightIcon />}
              onClick={onNextPage}
              isDisabled={currentPage === totalPages - 1}
              size="sm"
            />
          </Tooltip>
        </HStack>

        <HStack spacing={2}>
          <Menu>
            <Tooltip label="Settings (S)">
              <MenuButton
                as={IconButton}
                icon={<SettingsIcon />}
                variant="ghost"
                size="sm"
              />
            </Tooltip>
            <MenuList>
              <MenuItem onClick={() => onModeSwitch({ target: { checked: !isVerticalMode } } as any)}>
                <HStack>
                  <Text>Vertical Mode</Text>
                  <Switch isChecked={isVerticalMode} size="sm" />
                </HStack>
              </MenuItem>
              <MenuItem onClick={() => onTwoPageSwitch({ target: { checked: !isTwoPage } } as any)}>
                <HStack>
                  <Text>Two Page View</Text>
                  <Switch isChecked={isTwoPage} size="sm" />
                </HStack>
              </MenuItem>
              <MenuItem onClick={() => onAutoScrollToggle({ target: { checked: !autoScroll } } as any)}>
                <HStack>
                  <Text>Auto-scroll</Text>
                  <Switch isChecked={autoScroll} size="sm" />
                </HStack>
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => onBrightnessChange(brightness === 100 ? 150 : 100)}>
                <HStack>
                  <Text>Toggle Brightness</Text>
                  {brightness === 100 ? <SunIcon /> : <MoonIcon />}
                </HStack>
              </MenuItem>
            </MenuList>
          </Menu>

          <Tooltip label="Download">
            <IconButton
              aria-label="Download"
              icon={<DownloadIcon />}
              onClick={onDownload}
              isLoading={isDownloading}
              size="sm"
            />
          </Tooltip>

          <Tooltip label="Share">
            <IconButton
              aria-label="Share"
              icon={<ExternalLinkIcon />}
              onClick={onShare}
              size="sm"
            />
          </Tooltip>

          <Tooltip label="Fullscreen (F)">
            <IconButton
              aria-label="Toggle fullscreen"
              icon={fullscreen ? <ChevronDownIcon /> : <ChevronUpIcon />}
              onClick={onFullscreen}
              size="sm"
            />
          </Tooltip>

          <BookmarkButton mangaData={mangaData} />
        </HStack>
      </HStack>

      {/* Additional controls for vertical mode */}
      {isVerticalMode && (
        <HStack spacing={4} width="100%" justify="center">
          <Slider
            value={autoScrollSpeed}
            onChange={onAutoScrollSpeedChange}
            min={1}
            max={10}
            step={1}
            width="200px"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Button
            size="sm"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            leftIcon={<ChevronUpIcon />}
          >
            Back to Top
          </Button>
        </HStack>
      )}
    </VStack>
  );
});

MangaControls.displayName = 'MangaControls';

export default MangaControls;
