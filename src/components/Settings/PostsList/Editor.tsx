import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Textarea,
  IconButton,
  Tooltip,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdLink,
  MdImage,
  MdCode,
  MdFormatQuote,
  MdVisibility,
  MdEdit,
  MdCloudUpload,
  MdMenuBook
} from 'react-icons/md';
import parse, { DOMNode, Element } from 'html-react-parser';
import LazyImage from '../../ui/common/LazyImage';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung bài viết...",
  minHeight = "400px",
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);

  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const previewBg = useColorModeValue('gray.50', 'gray.900');

  // Insert text at cursor position
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  // Toolbar actions
  const formatBold = () => insertText('<strong>', '</strong>');
  const formatItalic = () => insertText('<em>', '</em>');
  const formatUnderline = () => insertText('<u>', '</u>');
  const formatCode = () => insertText('<code>', '</code>');
  const formatQuote = () => insertText('<blockquote>', '</blockquote>');
  
  const insertList = (ordered: boolean = false) => {
    const tag = ordered ? 'ol' : 'ul';
    insertText(`<${tag}>\n  <li>`, `</li>\n</${tag}>`);
  };

  const insertLink = () => {
    const url = prompt('Nhập URL:');
    if (url) {
      insertText(`<a href="${url}">`, '</a>');
    }
  };

  const handleImageInsert = (html: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText = value.substring(0, start) + html + value.substring(end);
    onChange(newText);

    // Set cursor after inserted image
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + html.length, start + html.length);
    }, 0);
  };

  const insertHeading = (level: number) => {
    insertText(`<h${level}>`, `</h${level}>`);
  };

  const insertParagraph = () => {
    insertText('<p>', '</p>');
  };

  const insertBreak = () => {
    insertText('<br />', '');
  };

  const insertDivider = () => {
    insertText('<hr />', '');
  };

  // Render HTML preview
  const renderPreview = () => {
    return (
      <Box
        bg={previewBg}
        p={4}
        borderRadius="md"
        border="1px"
        borderColor={borderColor}
        minH={minHeight}
      >
        {parse(value, { replace: replaceImage })}
      </Box>
    );
  };

  const replaceImage = (node: DOMNode) => {
    if (node.type === 'tag' && node.name === 'img') {
      const { src, alt, width, height, style } = node.attribs;

      // Extract width and height from style if present
      const styleObj: Record<string, string> = (style || '').split(';').reduce((acc: Record<string, string>, s) => {
        const [key, val] = s.split(':').map(p => p.trim());
        if (key && val) acc[key] = val;
        return acc;
      }, {});

      return (
        <LazyImage
          src={src}
          alt={alt || 'Image'}
          width={width || styleObj.width}
          height={height || styleObj.height}
          style={styleObj}
          objectFit={styleObj.objectFit as React.CSSProperties['objectFit'] || 'contain'}
        />
      );
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Mode Toggle - Removed */}
      <Box bg={bgColor} p={3} borderRadius="md" border="1px" borderColor={borderColor}>
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            Text Editor Mode
          </Text>
        </HStack>
      </Box>

      {/* Toolbar - Always show */}
      <Box bg={bgColor} p={3} borderRadius="md" border="1px" borderColor={borderColor}>
        <VStack spacing={3}>
          {/* Text Formatting */}
          <HStack spacing={2} wrap="wrap">
            <Text fontSize="sm" fontWeight="bold" minW="60px">Format:</Text>
            <Tooltip label="Bold">
              <IconButton
                aria-label="Bold"
                icon={<MdFormatBold />}
                size="sm"
                onClick={formatBold}
              />
            </Tooltip>
            <Tooltip label="Italic">
              <IconButton
                aria-label="Italic"
                icon={<MdFormatItalic />}
                size="sm"
                onClick={formatItalic}
              />
            </Tooltip>
            <Tooltip label="Underline">
              <IconButton
                aria-label="Underline"
                icon={<MdFormatUnderlined />}
                size="sm"
                onClick={formatUnderline}
              />
            </Tooltip>
            <Tooltip label="Code">
              <IconButton
                aria-label="Code"
                icon={<MdCode />}
                size="sm"
                onClick={formatCode}
              />
            </Tooltip>
            <Tooltip label="Quote">
              <IconButton
                aria-label="Quote"
                icon={<MdFormatQuote />}
                size="sm"
                onClick={formatQuote}
              />
            </Tooltip>
            <Tooltip label="Insert Link">
              <IconButton
                aria-label="Insert Link"
                icon={<MdLink />}
                size="sm"
                onClick={insertLink}
              />
            </Tooltip>
            <Tooltip label="Insert Image (Base64)">
              <IconButton
                aria-label="Insert Image"
                icon={<MdImage />}
                size="sm"
                onClick={() => {
                  const base64 = prompt('Enter image Base64 URL:');
                  if (base64) {
                    handleImageInsert(`<img src="${base64}" alt="" style="width: 100%; height: auto; display: block;" />`);
                  }
                }}
              />
            </Tooltip>
            <Tooltip label="Bullet List">
              <IconButton
                aria-label="Bullet List"
                icon={<MdFormatListBulleted />}
                size="sm"
                onClick={() => insertList(false)}
              />
            </Tooltip>
            <Tooltip label="Numbered List">
              <IconButton
                aria-label="Numbered List"
                icon={<MdFormatListNumbered />}
                size="sm"
                onClick={() => insertList(true)}
              />
            </Tooltip>
            <Tooltip label="Insert Heading">
              <IconButton
                aria-label="Insert Heading"
                icon={<Text fontSize="md" fontWeight="bold">H1</Text>}
                size="sm"
                onClick={() => insertHeading(1)}
              />
            </Tooltip>
            <Tooltip label="Insert Paragraph">
              <IconButton
                aria-label="Insert Paragraph"
                icon={<Text fontSize="md" fontWeight="bold">P</Text>}
                size="sm"
                onClick={insertParagraph}
              />
            </Tooltip>
            <Tooltip label="Insert Line Break">
              <IconButton
                aria-label="Insert Line Break"
                icon={<Text fontSize="md" fontWeight="bold">BR</Text>}
                size="sm"
                onClick={insertBreak}
              />
            </Tooltip>
            <Tooltip label="Insert Divider">
              <IconButton
                aria-label="Insert Divider"
                icon={<Text fontSize="md" fontWeight="bold">HR</Text>}
                size="sm"
                onClick={insertDivider}
              />
            </Tooltip>
          </HStack>
        </VStack>
      </Box>

      {/* Content Area */}
      <Tabs index={activeTab} onChange={setActiveTab} isLazy>
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <MdEdit />
              <Text>Editor</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <MdVisibility />
              <Text>Preview</Text>
            </HStack>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              minH={minHeight}
              size="sm"
              p={4}
              border="1px"
              borderColor={borderColor}
              borderRadius="md"
              _focus={{ borderColor: 'blue.400' }}
              sx={{ fontVariantLigatures: 'none' }}
            />
          </TabPanel>
          <TabPanel p={0}>
            {renderPreview()}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Help Text - Removed Manga Upload Features */} 
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box flex="1">
          <Text fontSize="sm">
            📝 <strong>Rich Text Editor Features:</strong>
            <br />
            • Basic formatting: Bold, Italic, Underline, Lists, Code, Quote, Link
            <br />
            • Insert images by Base64 URL
            <br />
            • Real-time HTML preview
          </Text>
        </Box>
      </Alert>
    </VStack>
  );
};

export default Editor;
