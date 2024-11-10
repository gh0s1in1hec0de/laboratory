export interface CustomUploadImageProps {
  handleFileChange: (file: File) => void;
  id: string;
  label: string;
  formikErrorText?: string;
  disabled?: boolean;
}
