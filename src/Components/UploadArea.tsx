import { useRef } from "react";
import { Mic } from "lucide-react";

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
    <div className="flex flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        className="flex items-center gap-2 py-6 text-2xl text-white rounded-full px-24 font-regular bg-primary shadow-button3d shadow-sky-800 hover:shadow-none hover:translate-y-[8px] transition"
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <Mic size={"28px"} />
        העלה הקלטה
      </button>
      <p className="w-[300px] text-center mt-6 text-textColor opacity-70 text-lg">
        העלה הקלטה של השיעור וקבל סיכום חכם שאפשר להעתיק למחברת
      </p>
    </div>
  );
}
