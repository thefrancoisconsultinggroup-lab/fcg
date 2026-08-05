import { SummitWaterTheme } from "@/components/summit/summit-water-theme";

export default function HumanCapacitySummitLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SummitWaterTheme />
      {children}
    </>
  );
}
