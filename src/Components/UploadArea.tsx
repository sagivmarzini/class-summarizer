import { useRef } from "react";

interface Props {
  onUpload: (file: File) => void;
}

export default function UploadArea({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      onUpload(file);
    }
  }

  return (
    <div
      onClick={() => {
        inputRef.current?.click();
      }}
      className="p-8 mb-6 text-center transition-all border-2 border-gray-200 border-dashed cursor-pointer rounded-xl hover:border-blue-500 hover:bg-blue-50"
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden w-full"
      />
      <h3 className="mb-2 text-lg font-semibold text-gray-800">
        העלה הקלטת שיעור
      </h3>
      <p className="text-gray-600">לחצו או גררו קובץ שמע לפה</p>
    </div>
  );
}
