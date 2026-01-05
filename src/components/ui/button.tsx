import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline",
        // SKEW Custom Variants
        skewPrimary: 
          "bg-primary text-primary-foreground font-bold relative overflow-hidden hover:shadow-[0_0_20px_rgba(255,69,0,0.4)] hover:scale-105 active:scale-95 [-webkit-transform:skewX(-5deg)] [transform:skewX(-5deg)]",
        skewOutline:
          "border-2 border-primary text-primary bg-transparent font-bold hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(255,69,0,0.3)] [-webkit-transform:skewX(-5deg)] [transform:skewX(-5deg)]",
        skewGreen:
          "bg-accent text-accent-foreground font-bold hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-105 active:scale-95 [-webkit-transform:skewX(-5deg)] [transform:skewX(-5deg)]",
        terminal:
          "bg-secondary/50 border border-border text-foreground font-mono hover:bg-secondary hover:border-primary/50 rounded-md",
        trade:
          "bg-primary/20 border border-primary text-primary font-mono text-xs hover:bg-primary hover:text-primary-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
