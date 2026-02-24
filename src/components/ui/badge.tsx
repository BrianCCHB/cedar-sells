// Badge component for Cedar Cash Home Buyers

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-cedar-green text-white",
        secondary: "border-transparent bg-gray-100 text-gray-900",
        destructive: "border-transparent bg-red-500 text-white",
        outline: "border-cedar-green text-cedar-green",
        success: "border-transparent bg-green-500 text-white",
        warning: "border-transparent bg-yellow-500 text-black",
        info: "border-transparent bg-blue-500 text-white",
        cedar: "border-transparent bg-cedar-logo-green text-white",
        deal: {
          "Fix & Flip": "border-transparent bg-orange-500 text-white",
          "Wholesale": "border-transparent bg-purple-500 text-white",
          "Rental": "border-transparent bg-blue-500 text-white",
        },
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Specialized badges for different property aspects
export function DealTypeBadge({ dealType }: { dealType: string }) {
  const variants = {
    "Fix & Flip": "bg-orange-500 text-white",
    "Wholesale": "bg-purple-500 text-white",
    "Rental": "bg-blue-500 text-white",
  };

  const className = variants[dealType as keyof typeof variants] || "bg-gray-500 text-white";

  return (
    <Badge className={className}>
      {dealType}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variants = {
    "Available": "bg-green-500 text-white",
    "Under Contract": "bg-yellow-500 text-black",
    "Sold": "bg-gray-500 text-white",
    "Off Market": "bg-red-500 text-white",
  };

  const className = variants[status as keyof typeof variants] || "bg-gray-500 text-white";

  return (
    <Badge className={className}>
      {status}
    </Badge>
  );
}

export function AccessTierBadge({ tier }: { tier: string }) {
  const variants = {
    "public": "bg-gray-400 text-white",
    "registered": "bg-cedar-green text-white",
    "vip": "bg-cedar-logo-green text-white",
  };

  const className = variants[tier as keyof typeof variants] || "bg-gray-400 text-white";
  const labels = {
    "public": "Public",
    "registered": "Members",
    "vip": "VIP Only",
  };

  const label = labels[tier as keyof typeof labels] || tier;

  return (
    <Badge className={className}>
      {label}
    </Badge>
  );
}

export { Badge, badgeVariants };