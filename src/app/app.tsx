import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AppearanceProvider } from "../features/appearance/appearance-provider";
import { queryClient } from "./query-client";
import { router } from "./router";

// Menyatukan provider global tepat satu kali pada root aplikasi.
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <RouterProvider router={router} />
      </AppearanceProvider>
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  );
}
