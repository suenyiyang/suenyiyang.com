import { useSelectedLayoutSegment } from "next/navigation";

export const useSelectedPage = () => {
  const segment = useSelectedLayoutSegment();
  return segment ?? "home";
};
