import { Loader } from "@/components/layout/Loader";

// Shown while any route (storefront, login, /admin) is loading.
export default function Loading() {
  return <Loader fullScreen />;
}
