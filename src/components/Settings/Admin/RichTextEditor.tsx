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
import MangaUploader from './MangaUploader';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung bài viết...",
  minHeight = "400px"
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isMangaMode, setIsMangaMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  
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

  /**
   * 📚 Handle manga content generation
   */
  const handleMangaContentGenerate = (mangaHtml: string) => {
    onChange(mangaHtml);
    setActiveTab(1); // Switch to preview tab
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
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Mode Toggle */}
      <Box bg={bgColor} p={3} borderRadius="md" border="1px" borderColor={borderColor}>
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold">
            {isMangaMode ? '📚 Manga Upload Mode' : '📝 Text Editor Mode'}
          </Text>
          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="manga-mode" mb="0" fontSize="sm">
              Manga Mode
            </FormLabel>
            <Switch
              id="manga-mode"
              isChecked={isMangaMode}
              onChange={(e) => setIsMangaMode(e.target.checked)}
              colorScheme="blue"
            />
          </FormControl>
        </HStack>

        {isMangaMode && (
          <Alert status="info" mt={3} borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              📚 Manga mode: Upload multiple images, auto-sort by number, drag & drop to reorder, generate base64 HTML for Blogger
            </Text>
          </Alert>
        )}
      </Box>

      {/* Toolbar - Only show in text mode */}
      {!isMangaMode && (
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
          </HStack>

          {/* Lists and Links */}
          <HStack spacing={2} wrap="wrap">
            <Text fontSize="sm" fontWeight="bold" minW="60px">Insert:</Text>
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
            <Tooltip label="Link">
              <IconButton
                aria-label="Link"
                icon={<MdLink />}
                size="sm"
                onClick={insertLink}
              />
            </Tooltip>
         
          </HStack>

          {/* Headings and Structure */}
          <HStack spacing={2} wrap="wrap">
            <Text fontSize="sm" fontWeight="bold" minW="60px">Structure:</Text>
            <Button size="sm" onClick={() => insertHeading(1)}>H1</Button>
            <Button size="sm" onClick={() => insertHeading(2)}>H2</Button>
            <Button size="sm" onClick={() => insertHeading(3)}>H3</Button>
            <Button size="sm" onClick={insertParagraph}>P</Button>
            <Button size="sm" onClick={insertBreak}>BR</Button>
            <Button size="sm" onClick={insertDivider}>HR</Button>
          </HStack>
        </VStack>
      </Box>
      )}

      {/* Editor Tabs */}
      <Tabs index={activeTab} onChange={setActiveTab}>
        <TabList>
          {!isMangaMode ? (
            <>
              <Tab>
                <HStack spacing={2}>
                  <MdEdit />
                  <Text>Chỉnh sửa</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <MdVisibility />
                  <Text>Xem trước</Text>
                </HStack>
              </Tab>
            </>
          ) : (
            <>
              <Tab>
                <HStack spacing={2}>
                  <MdMenuBook />
                  <Text>Upload Manga</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <MdVisibility />
                  <Text>Xem trước</Text>
                </HStack>
              </Tab>
            </>
          )}
        </TabList>

        <TabPanels>
          {!isMangaMode ? (
            <>
              <TabPanel p={0} pt={4}>
                <Textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  minH={minHeight}
                  resize="vertical"
                  fontFamily="monospace"
                  fontSize="sm"
                />
              </TabPanel>
              <TabPanel p={0} pt={4}>
                {renderPreview()}
              </TabPanel>
            </>
          ) : (
            <>
              <TabPanel p={0} pt={4}>
                <MangaUploader
                  onContentGenerate={handleMangaContentGenerate}
                  disabled={false}
                />
              </TabPanel>
              <TabPanel p={0} pt={4}>
                {renderPreview()}
              </TabPanel>
            </>
          )}
        </TabPanels>
      </Tabs>

      {/* Help Text */}
      <Text fontSize="xs" color="gray.500">
        {isMangaMode ? (
          <>
            � <strong>Manga Mode:</strong> Upload multiple images → Auto-sort by number → Drag & drop to reorder → Generate base64 HTML for Blogger
          </>
        ) : (
          <>
            💡 <strong>Text Mode:</strong> Use HTML tags to format content. Use "Preview" tab to check results.
          </>
        )}
      </Text>


    </VStack>
  );
};

export default RichTextEditor;
