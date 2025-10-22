import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ExtractedFile {
  name: string;
  type: string;
  content: string;
  size: number;
  timestamp: Date;
}

export async function extractTextFromFile(file: File): Promise<ExtractedFile> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  let content = '';

  try {
    // 1. PDFs
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      content = await extractTextFromPDF(file);
    
    // 2. Word Documents
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      content = await extractTextFromDOCX(file);
    
    // 3. PowerPoint Presentations
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      fileType === 'application/vnd.ms-powerpoint' ||
      fileName.endsWith('.pptx') ||
      fileName.endsWith('.ppt')
    ) {
      content = await extractTextFromPPTX(file);
    
    // 4. Spreadsheets & CSV
    } else if (
      fileType.includes('spreadsheet') ||
      fileType === 'text/csv' ||
      fileType === 'application/csv' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv')
    ) {
      content = await extractTextFromSpreadsheet(file);
    
    // 5. Images (OCR)
    } else if (
      fileType.startsWith('image/') ||
      fileName.match(/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i)
    ) {
      content = await extractTextFromImage(file);
    
    // 6. Plain Text, Markdown, JSON, XML, HTML
    } else if (
      fileType.startsWith('text/') ||
      fileType === 'application/json' ||
      fileType === 'application/xml' ||
      fileType === 'text/html' ||
      fileName.match(/\.(txt|md|json|xml|html|css|js|ts|py|java|cpp|c|h)$/i)
    ) {
      content = await extractTextFromPlainText(file);
    
    // 7. Fallback - try to read as text
    } else {
      try {
        content = await file.text();
        if (!content.trim()) {
          content = `[Binary file: ${file.name} - ${formatFileSize(file.size)}. Content cannot be extracted as text.]`;
        }
      } catch {
        content = `[Unsupported file format: ${file.name} (${fileType}). Unable to extract text content.]`;
      }
    }

    return {
      name: file.name,
      type: fileType,
      content: content.trim() || '[No extractable text found]',
      size: file.size,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return {
      name: file.name,
      type: fileType,
      content: `[Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      size: file.size,
      timestamp: new Date()
    };
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = '';
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    text += `--- Page ${i + 1} ---\n${pageText}\n\n`;
  }
  return text;
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromPPTX(file: File): Promise<string> {
  try {
    // For now, we'll try to read it as a zip and extract text
    // This is a simplified approach - in production you'd use a proper PPTX parser
    const text = await file.text();
    return `[PowerPoint file: ${file.name}. Full PPTX parsing not yet implemented. File size: ${formatFileSize(file.size)}]`;
  } catch {
    return `[PowerPoint file: ${file.name}. Unable to extract text content.]`;
  }
}

async function extractTextFromSpreadsheet(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  let text = '';
  workbook.SheetNames.forEach((sheetName, index) => {
    text += `--- Sheet: ${sheetName} ---\n`;
    const worksheet = workbook.Sheets[sheetName];
    const csvData = XLSX.utils.sheet_to_csv(worksheet);
    text += csvData + '\n\n';
  });
  
  return text;
}

async function extractTextFromImage(file: File): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => console.log(m) // Optional: log OCR progress
    });
    
    if (!text.trim()) {
      return `[Image file: ${file.name}. No text detected in image.]`;
    }
    
    return `--- Text extracted from image: ${file.name} ---\n${text}`;
  } catch (error) {
    return `[Image file: ${file.name}. OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

async function extractTextFromPlainText(file: File): Promise<string> {
  const text = await file.text();
  
  // If it's JSON, try to pretty-print it
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    try {
      const parsed = JSON.parse(text);
      return `--- JSON Content from ${file.name} ---\n${JSON.stringify(parsed, null, 2)}`;
    } catch {
      return text; // Return as-is if JSON parsing fails
    }
  }
  
  // If it's HTML, strip tags for better readability
  if (file.type === 'text/html' || file.name.endsWith('.html')) {
    const strippedText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return `--- HTML Content from ${file.name} (tags stripped) ---\n${strippedText}`;
  }
  
  return text;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function chunkText(text: string, maxLength = 2000): string[] {
  if (text.length <= maxLength) return [text];

  const sentences = text.split(/(?<=[.?!])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length < maxLength) {
      current += sentence + ' ';
    } else {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = sentence + ' ';
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

export function getRelevantChunks(chunks: string[], query: string, maxChunks = 3): string[] {
  // Simple relevance scoring based on keyword overlap
  const queryWords = query.toLowerCase().split(/\s+/);
  
  const scoredChunks = chunks.map(chunk => {
    const chunkWords = chunk.toLowerCase().split(/\s+/);
    const score = queryWords.reduce((acc, word) => {
      return acc + (chunkWords.includes(word) ? 1 : 0);
    }, 0);
    return { chunk, score };
  });

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map(item => item.chunk);
}