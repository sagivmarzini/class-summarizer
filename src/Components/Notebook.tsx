import { type Notebook } from "../utils/types";

interface Props {
  notebook?: Notebook;
}

export default function Notebook({ notebook }: Props) {
  return (
    <div className="h-screen grid grid-cols-3 grid-rows-10 min-h-[800px] border border-gray-200 rounded-xl overflow-hidden bg-gradient-to-r from-gray-50 to-white">
      <div className="col-span-3 row-span-1 p-6 border-b">
        <textarea
          id="titleArea"
          className="w-full p-3 leading-relaxed text-gray-800 bg-transparent resize-none focus:outline-none focus:bg-blue-50/20 font-inherit"
          placeholder="כותרת..."
          value={notebook?.title}
        ></textarea>
      </div>

      <div className="col-span-2 row-span-6 p-6">
        <textarea
          id="notesArea"
          className="w-full p-3 leading-relaxed text-gray-800 bg-transparent resize-none focus:outline-none focus:bg-blue-50/20 font-inherit"
          placeholder="תוכן..."
          value={notebook?.notes}
        ></textarea>
      </div>

      <div className="p-6">
        <textarea
          id="cuesArea"
          className="w-full p-3 leading-relaxed text-gray-800 bg-transparent resize-none focus:outline-none focus:bg-blue-50/20 font-inherit"
          placeholder="נקודות, שאלות, ומושגי מפתח..."
          value={notebook?.cues}
        ></textarea>
      </div>

      <div className="col-span-3 row-span-3 p-6 bg-gray-50">
        <textarea
          id="summaryArea"
          className="w-full p-3 leading-relaxed text-gray-800 bg-transparent resize-none focus:outline-none focus:bg-blue-50/20 font-inherit"
          placeholder="סיכום..."
          value={notebook?.summary}
        ></textarea>
      </div>
    </div>
  );
}
