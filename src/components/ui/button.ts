// Class names of the original shadcn `Button` (src/components/ui/button.tsx), computed at build
// time. `buttonVariants` is the same cva definition, copied verbatim, and `cn` the same
// clsx + tailwind-merge, so tailwind-merge drops conflicting classes (e.g. `h-9` loses to
// `h-auto`) exactly as in the original. The original is always used as `<Button asChild>`
// around a link, so the class string goes on the `<a>` itself; there is no wrapper element.
// Nothing here ships to the browser.
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/** Class string the original `<Button variant size className asChild>` puts on its child. */
export const buttonClass = ({ variant, size, className }: VariantProps<typeof buttonVariants> & { className?: string }) =>
  cn(buttonVariants({ variant, size, className }));
