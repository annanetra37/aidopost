import { Suspense } from "react";
import { Wizard } from "@/components/studio/Wizard";

export default function StudioPage() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  );
}
