interface Props {
  stage?: "transcribing" | "summarizing";
}

export default function Processing({ stage }: Props) {
  const message =
    stage === "transcribing" ? "מתמלל את השיעור..." : "מסכם את השיעור...";

  return (
    <div id="processing" className={`my-6 text-center`}>
      <div className="w-10 h-10 mx-auto border-4 border-gray-200 rounded-full border-t-primary animate-spin"></div>
      <p className="mt-4 text-textColor">{message}</p>
    </div>
  );
}
