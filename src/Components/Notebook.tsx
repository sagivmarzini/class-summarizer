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
      className="max-w-2xl w-full h-full bg-notebook-lines bg-[length:100%_30px] relative pt-[100px] pr-8 overflow-hidden rounded-lg shadow-xl
    before:content-[''] before:block before:absolute before:z-10 before:top-0 before:right-8 before:h-full before:w-[1px] before:bg-[#db4034]"
    >
      <header className="absolute top-0 right-0 grid w-full h-20 bg-white place-items-center">
        <h1 className="text-2xl font-bold font-yarden mr-8 pt-[22px] text-center">
          {notebook?.title}
        </h1>
      </header>
      <main className="h-full grid gap-x-2 pl-4 grid-cols-3 pr-2 grid-rows-4 notebook-text text-sm  font-gveret-levin leading-[30px]">
        <div
          className="col-span-2 row-span-3 overflow-auto"
          dangerouslySetInnerHTML={{ __html: notebook?.notes || "" }}
        ></div>
        <div
          className="col-span-1 row-span-3 overflow-auto text-blue-800"
          dangerouslySetInnerHTML={{ __html: notebook?.cues || "" }}
        ></div>
        <div
          className="col-span-3 row-span-1 text-red-800 pt-[19px] overflow-auto"
          dangerouslySetInnerHTML={{ __html: notebook?.summary || "" }}
        ></div>
      </main>
    </div>
  );
});

export default Notebook;
