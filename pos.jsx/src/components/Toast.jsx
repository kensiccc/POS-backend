export default function Toast({ msg, isErr }) {
  if (!msg) return null

  return (
    <div className={`toast ${isErr ? 'err' : ''} show`}>
      {msg}
    </div>
  )
}
