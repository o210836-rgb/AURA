import React from 'react';

interface MarkdownProps {
  content: string;
}

export function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-lg font-bold text-gray-800 mt-4 mb-2">
          {parseInline(line.substring(4))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-xl font-bold text-gray-800 mt-4 mb-2">
          {parseInline(line.substring(3))}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} className="text-2xl font-bold text-gray-800 mt-4 mb-2">
          {parseInline(line.substring(2))}
        </h1>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(
          <li key={key++} className="ml-4">
            {parseInline(lines[i].substring(2))}
          </li>
        );
        i++;
      }
      i--;
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-2">
          {listItems}
        </ul>
      );
    } else if (line.match(/^\d+\. /)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        const match = lines[i].match(/^\d+\. (.+)$/);
        if (match) {
          listItems.push(
            <li key={key++} className="ml-4">
              {parseInline(match[1])}
            </li>
          );
        }
        i++;
      }
      i--;
      elements.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 my-2">
          {listItems}
        </ol>
      );
    } else if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} className="bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto">
          <code className="text-sm text-gray-800">{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (line.trim() === '') {
      elements.push(<br key={key++} />);
    } else {
      elements.push(
        <p key={key++} className="my-1">
          {parseInline(line)}
        </p>
      );
    }
  }

  return elements;
}

function parseInline(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let current = '';
  let i = 0;
  let key = 0;

  while (i < text.length) {
    if (text.substring(i, i + 2) === '**') {
      if (current) {
        elements.push(<span key={key++}>{current}</span>);
        current = '';
      }
      i += 2;
      let bold = '';
      while (i < text.length && text.substring(i, i + 2) !== '**') {
        bold += text[i];
        i++;
      }
      if (text.substring(i, i + 2) === '**') {
        elements.push(
          <strong key={key++} className="font-bold text-gray-900">
            {bold}
          </strong>
        );
        i += 2;
      } else {
        current += '**' + bold;
      }
    } else if (text[i] === '*' && text[i + 1] !== '*') {
      if (current) {
        elements.push(<span key={key++}>{current}</span>);
        current = '';
      }
      i++;
      let italic = '';
      while (i < text.length && text[i] !== '*') {
        italic += text[i];
        i++;
      }
      if (text[i] === '*') {
        elements.push(
          <em key={key++} className="italic">
            {italic}
          </em>
        );
        i++;
      } else {
        current += '*' + italic;
      }
    } else if (text[i] === '`') {
      if (current) {
        elements.push(<span key={key++}>{current}</span>);
        current = '';
      }
      i++;
      let code = '';
      while (i < text.length && text[i] !== '`') {
        code += text[i];
        i++;
      }
      if (text[i] === '`') {
        elements.push(
          <code key={key++} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
            {code}
          </code>
        );
        i++;
      } else {
        current += '`' + code;
      }
    } else if (text[i] === '[') {
      const linkStart = i;
      i++;
      let linkText = '';
      while (i < text.length && text[i] !== ']') {
        linkText += text[i];
        i++;
      }
      if (text[i] === ']' && text[i + 1] === '(') {
        i += 2;
        let url = '';
        while (i < text.length && text[i] !== ')') {
          url += text[i];
          i++;
        }
        if (text[i] === ')') {
          if (current) {
            elements.push(<span key={key++}>{current}</span>);
            current = '';
          }
          elements.push(
            <a
              key={key++}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 underline"
            >
              {linkText}
            </a>
          );
          i++;
        } else {
          current += text.substring(linkStart, i);
        }
      } else {
        current += text.substring(linkStart, i);
      }
    } else {
      current += text[i];
      i++;
    }
  }

  if (current) {
    elements.push(<span key={key++}>{current}</span>);
  }

  return elements.length > 0 ? elements : [text];
}

export default function Markdown({ content }: MarkdownProps) {
  return <div className="markdown-content">{parseMarkdown(content)}</div>;
}
