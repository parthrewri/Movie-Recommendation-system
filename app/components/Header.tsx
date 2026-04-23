export default function Header() {
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-black text-white">
      <h1 className="text-xl font-bold">🎬 CineMatch</h1>

      <div className="space-x-6">
        <button className="hover:text-gray-400">Movies</button>
        <button className="hover:text-gray-400">Watchlist</button>
        <button className="hover:text-gray-400">Profile</button>
      </div>
    </div>
  )
}