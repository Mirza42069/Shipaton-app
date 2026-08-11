import { useRouter } from "expo-router";

import { TutorialCarousel } from "@/components/tutorial-carousel";

export default function TutorialScreen() {
  const router = useRouter();
  return <TutorialCarousel onFinish={() => router.back()} />;
}
