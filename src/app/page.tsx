import { ReleaseBoard } from "@/features/board/release-board";
import { Studio } from "@/features/studio/studio";

export default function Home() {
  return <Studio board={<ReleaseBoard />} />;
}
