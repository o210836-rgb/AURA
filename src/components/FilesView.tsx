import { FileText, X, Download } from 'lucide-react';
import { ExtractedFile } from '../utils/fileExtractor';

interface FilesViewProps {
  files: ExtractedFile[];
  onRemoveFile: (fileName: string) => void;
}

export default function FilesView({ files, onRemoveFile }: FilesViewProps) {
  if (files.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Files Uploaded</h3>
        <p className="text-gray-600 max-w-md">
          Upload files from the chat interface to see them here. Supported formats include PDF, DOCX, PPTX, Excel, images, and text files.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Uploaded Files</h2>
        <p className="text-gray-600">Manage your uploaded documents and files</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <div
            key={file.name}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <button
                  onClick={() => onRemoveFile(file.name)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate" title={file.name}>
                {file.name}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Type:</span>
                  <span className="font-medium text-gray-900">{file.type}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Size:</span>
                  <span className="font-medium text-gray-900">
                    {(file.content.length / 1024).toFixed(2)} KB
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Uploaded:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 line-clamp-3">
                  {file.content.substring(0, 150)}...
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
