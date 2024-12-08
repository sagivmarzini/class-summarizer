import React from "react";
import { type NotebookType } from "../utils/types";

interface Props {
  notebook: NotebookType | null;
}

/*
 * Notebook component that displays Cornell notes format content
 * Content is received directly from Claude API - a trusted source
 */
const Notebook: React.FC<Props> = React.memo(({ notebook }) => {
  return (
    <div
      className="w-full h-full bg-notebook-lines bg-[length:100%_30px] relative pt-[90px] pr-8 overflow-hidden rounded-lg shadow-2xl
    before:content-[''] before:block before:absolute before:z-10 before:top-0 before:right-8 before:h-full before:w-[1px] before:bg-[#db4034]"
    >
      <header className="absolute top-0 right-0 grid w-full h-20 bg-white place-items-center">
        <h1 className="text-2xl font-bold font-yarden mr-8 pt-[22px] text-center">
          {notebook?.title}
        </h1>
      </header>
      <main className="grid gap-x-2 ml-4 h-full grid-cols-3 mr-2 grid-rows-4 pt-[10px] notebook-text text-sm  font-gveret-levin leading-[30px]">
        <div
          className="col-span-2 row-span-3 overflow-auto leading-[29.75px]"
          dangerouslySetInnerHTML={{ __html: notebook?.notes || "" }}
        ></div>
        <div
          className="col-span-1 row-span-3 overflow-auto text-blue-800 leading-[29.2px]"
          dangerouslySetInnerHTML={{ __html: notebook?.cues || "" }}
        ></div>
        <div
          className="col-span-3 row-span-1 text-red-800 pt-[19px] overflow-auto leading-[30px]"
          dangerouslySetInnerHTML={{ __html: notebook?.summary || "" }}
        ></div>
      </main>
    </div>
  );
});

export default Notebook;
