import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  
  &:hover {
  color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const Title = styled.h2`
  color: #ffffff;
  text-align: center;
  margin-bottom: 30px;
`;

const UploadArea = styled.div<{ $isDragOver: boolean }>`
  border: 2px dashed ${({ $isDragOver, theme }) => $isDragOver ? theme.colors.border.strong : '#666666'};
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  background: ${({ $isDragOver }) => $isDragOver ? 'rgba(255,255,255,0.06)' : 'transparent'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.medium};
    background: rgba(255,255,255,0.04);
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 15px;
  color: #666666;
`;

const UploadText = styled.p`
  color: #cccccc;
  margin-bottom: 10px;
`;

const UploadSubtext = styled.p`
  color: #999999;
  font-size: 0.9rem;
`;

const HiddenInput = styled.input`
  display: none;
`;

const PreviewArea = styled.div`
  margin-bottom: 20px;
`;

const PreviewImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid ${({ theme }) => theme.colors.border.medium};
  display: block;
  margin: 0 auto 20px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${({ $variant }) => $variant === 'primary' ? `
    background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
    color: white;
    border: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    }
  ` : `
    background: transparent;
    color: #cccccc;
    border: 1px solid #666666;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: ${({ theme }) => theme.colors.border.medium};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      onClose();
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose}>×</CloseButton>
        
        <Title>Upload Profile Photo</Title>

        {!previewUrl ? (
          <UploadArea
            $isDragOver={isDragOver}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <UploadIcon>📷</UploadIcon>
            <UploadText>Click to upload or drag and drop</UploadText>
            <UploadSubtext>PNG, JPG, GIF up to 10MB</UploadSubtext>
          </UploadArea>
        ) : (
          <PreviewArea>
            <PreviewImage src={previewUrl} alt="Preview" />
          </PreviewArea>
        )}

        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
        />

        <ButtonGroup>
          <Button $variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          {previewUrl && (
            <Button $variant="primary" onClick={handleUpload}>
              Upload Photo
            </Button>
          )}
          {previewUrl && (
            <Button $variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Choose Different
            </Button>
          )}
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PhotoUploadModal;