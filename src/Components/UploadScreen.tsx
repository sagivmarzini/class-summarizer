import { useRef } from "react";
import { Mic } from "lucide-react";

interface Props {
  onUpload: (file: File) => void;
}

export default function UploadScreen({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      onUpload(file);
    }
  }

  return (
    <div className="absolute top-0 right-0 grid justify-center w-screen h-screen ">
      <div className="bg-[url('src/assets/notebook-background.jpg')] bg-cover w-full h-full absolute -z-10 opacity-40"></div>

      <h1 className="px-10 pt-20 text-5xl font-bold text-center justify-self-center text-textColor drop-shadow-[0_4px_#709ECC]">
        סיכומים חכמים לשיעורים
      </h1>

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
    </div>
  );
}
