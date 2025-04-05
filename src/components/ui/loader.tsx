import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const loaderVariants = cva("relative inline-flex items-center justify-center", {
  variants: {
    size: {
      default: "size-8",
      sm: "size-5",
      lg: "size-12",
    },
    centered: {
      true: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      false: "",
    },
  },
  defaultVariants: {
    size: "default",
    centered: false,
  },
});

const barVariants = cva(
  "absolute h-[25%] w-[8%] rounded-full bg-current opacity-0 animate-fade-in-out",
  {
    variants: {
      size: {
        default: "top-[8.5%]",
        sm: "top-[8.5%]",
        lg: "top-[8.5%]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const dotVariants = cva("rounded-full bg-current animate-pulse aspect-square", {
  variants: {
    size: {
      default: "size-2",
      sm: "size-1.5",
      lg: "size-2.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

interface LoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  variant?: "spinner" | "threedots";
}

function Loader({
  className,
  size,
  centered,
  variant = "threedots",
  ...props
}: LoaderProps) {
  if (variant === "threedots") {
    return (
      <div
        className={cn(loaderVariants({ size, centered, className }), "gap-1.5")}
        {...props}
      >
        <div
          className={cn(dotVariants({ size }))}
          style={{ animationDelay: "0ms" }}
        />
        <div
          className={cn(dotVariants({ size }))}
          style={{ animationDelay: "300ms" }}
        />
        <div
          className={cn(dotVariants({ size }))}
          style={{ animationDelay: "600ms" }}
        />
      </div>
    );
  }

  // Default: spinner
  // Create array of 12 bars
  const bars = Array.from({ length: 12 }).map((_, i) => {
    const rotation = i * 30; // 30 degrees per bar (360 / 12)
    const delay = -1.1 + i * 0.1; // Staggered delays matching original CSS

    return (
      <div
        key={i}
        className={cn(barVariants({ size }))}
        style={{
          transform: `rotate(${rotation}deg) translate(0, -130%)`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return (
    <div
      className={cn(
        loaderVariants({ size, centered, className }),
        "text-muted-foreground",
      )}
      {...props}
    >
      {bars}
    </div>
  );
}

function LoaderContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative w-full h-full min-h-[100px]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Loader, LoaderContainer, loaderVariants };
