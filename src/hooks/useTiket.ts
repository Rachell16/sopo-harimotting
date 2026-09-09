import { useQuery } from "@tanstack/react-query";
import { ambilSemuaTiket } from "@/lib/tickets.server";

// Polling tiap 4 detik supaya kasir & pintu masuk (device berbeda) tetap
// sinkron tanpa perlu setup websocket.
export function useTiketList() {
  const { data } = useQuery({
    queryKey: ["tiket"],
    queryFn: () => ambilSemuaTiket(),
    refetchInterval: 4000,
  });

  return data ?? [];
}
