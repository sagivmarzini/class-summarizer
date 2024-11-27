interface Props {
  isLoading: boolean;
}

export default function Processing({ isLoading }: Props) {
  return (
    <div
      id="processing"
      className={`${isLoading ? "" : "hidden"} my-6 text-center`}
    >
      <div className="w-10 h-10 mx-auto border-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
      <p className="mt-3 text-gray-600">מסכם את ההקלטה...</p>
    </div>
  );
}
