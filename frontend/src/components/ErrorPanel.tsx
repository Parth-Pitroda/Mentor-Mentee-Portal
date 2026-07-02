export default function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
      {message}
    </div>
  );
}
