import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileUploaded: (data: any[], originalFile?: File) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  acceptedFileTypes = '.xlsx,.xls,.csv',
  maxFileSizeMB = 16,
  multiple = false,
}) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes

  const handleFileRead = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      // Read the file as an array buffer
      const buffer = await file.arrayBuffer();
      
      // Parse the Excel file
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Convert to JSON with these specific options to preserve spaces in headers
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: true,
        defval: null,
        header: 'A', // Use A, B, C as headers initially
      });
      
      // If data is empty, throw an error
      if (!data || data.length === 0) {
        throw new Error('The Excel file is empty or could not be parsed');
      }
      
      // Get the header row (first row)
      const headerRow = data[0] as Record<string, unknown>;
      
      // Create a mapping of column letters to actual headers
      const headerMap: Record<string, string> = {};
      Object.entries(headerRow).forEach(([col, value]) => {
        if (value !== null && value !== undefined) {
          headerMap[col] = String(value);
        }
      });
      
      // Transform the data to use the actual headers and skip the header row
      const formattedData = data.slice(1).map((row: unknown) => {
        const typedRow = row as Record<string, unknown>;
        const newRow: Record<string, any> = {};
        Object.entries(typedRow).forEach(([col, value]) => {
          if (headerMap[col]) {
            newRow[headerMap[col]] = value;
          }
        });
        return newRow;
      });
      
      // Log the first row to check if headers are preserved
      console.log('Parsed data first row:', formattedData[0]);
      console.log('Headers:', Object.keys(formattedData[0]));
      
      setFileNames([file.name]);
      onFileUploaded(formattedData, file);
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      setError('Failed to parse the Excel file. Please make sure it is a valid XLSX file.');
    } finally {
      setLoading(false);
    }
  };

  const validateFiles = (files: FileList | null): File[] => {
    if (!files || files.length === 0) {
      setError('No files selected');
      return [];
    }

    const validFiles: File[] = [];
    let errorMessage = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = acceptedFileTypes.includes(fileExtension);
      
      // Check file size
      const isValidSize = file.size <= maxSizeBytes;

      if (!isValidType) {
        errorMessage = `${file.name} has an invalid file type. Accepted types: ${acceptedFileTypes}`;
        break;
      }

      if (!isValidSize) {
        errorMessage = `${file.name} exceeds the maximum file size of ${maxFileSizeMB}MB`;
        break;
      }

      validFiles.push(file);
    }

    if (errorMessage) {
      setError(errorMessage);
      return [];
    }

    return validFiles;
  };

  const handleFilesSelected = (files: FileList | null) => {
    setError(null);
    setLoading(true);

    try {
      const validFiles = validateFiles(files);
      
      if (validFiles.length > 0) {
        setFileNames(validFiles.map(file => file.name));
        
        // Process the first file (or all files if needed)
        handleFileRead(validFiles[0]);
      }
    } catch (err) {
      console.error('Error handling files:', err);
      setError('An error occurred while processing the files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div 
        className={`file-upload-container ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          style={{ display: 'none' }}
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          multiple={multiple}
        />
        
        <div className="file-icons">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="file-icon excel-icon">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 13H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 17H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 9H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="file-icon csv-icon">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18V12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 15L12 18L15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <div className="file-status">
          {fileNames.length > 0 && !loading ? (
            <p className="file-name">
              {fileNames[0]}
            </p>
          ) : (
            <p className="no-file">No file selected</p>
          )}
        </div>
        
        <button 
          className="choose-files-btn"
          onClick={openFileDialog}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path d="M19 14V17C19 18.1046 18.1046 19 17 19H7C5.89543 19 5 18.1046 5 17V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 7L12 3L8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          CHOOSE FILES
        </button>
        
        <p className="drop-text">or drop files here</p>
        
        {loading && (
          <div className="mt-4">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {error && (
          <div className="file-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;