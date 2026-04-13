import { useQuery } from "@tanstack/react-query";
import { getTracks } from "./api/tracks";
import { useRouter } from "@tanstack/react-router";
import { logout } from "./api/auth";
import { useAuthStore } from "./store/auth";

function App() {
  const router = useRouter();
  const {
    data: tracks,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tracks"],
    queryFn: getTracks,
    retry: 3,
    retryDelay: 1000,
  });

  const handleLogout = () => {
    logout();
    useAuthStore.getState().clear();
    router.navigate({ to: "/sign-in" });
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl text-green-500">Music store</h1>
        <img
          className="h-10 w-10 cursor-pointer scale-100 active:scale-95 transition duration-200"
          src="/logOut.png"
          alt="log-out"
          onClick={handleLogout}
        />
      </div>
      {isLoading ? <p className="mt-4">Loading tracks...</p> : null}
      {isError ? (
        <p className="mt-4 text-red-500">Failed to load tracks</p>
      ) : null}

      {Array.isArray(tracks) && tracks.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {tracks.map((track) => (
            <li key={track._id} className="rounded border p-3">
              <p className="font-semibold text-neutral-400">{track.name}</p>
              <p className="text-sm text-neutral-400">
                {track.author} · {track.album}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default App;
