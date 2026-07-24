import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = ComponentPropsWithoutRef<"div">;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[92rem] px-[clamp(1.25rem,5vw,5rem)]", className)}
      {...props}
    />
  );
}
