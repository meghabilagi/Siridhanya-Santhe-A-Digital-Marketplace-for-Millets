/**
 * ErrorMessage — displays an error in a red-bordered box.
 *
 * Props:
 *   message: string
 */
export default function ErrorMessage({ message }) {
  if (!message) return null

  return (
    <div
      className="border border-red-400 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm"
      role="alert"
    >
      <span className="font-medium">Error: </span>
      {message}
    </div>
  )
}
