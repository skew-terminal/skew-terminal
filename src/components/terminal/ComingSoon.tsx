import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export const ComingSoon = ({ feature, description }: ComingSoonProps) => {
  return (
    <div className="flex h-full items-center justify-center bg-background/50">
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary/60 border border-border">
          <Rocket className="h-8 w-8 text-primary" />
        </div>
        
        <h2 className="font-sans text-lg font-bold text-foreground">
          {feature} Coming Soon
        </h2>
        
        <p className="font-mono text-xs text-muted-foreground leading-relaxed">
          {description || "We're working hard to bring you this feature. Join the waitlist to be notified when it launches."}
        </p>
        
        <Button 
          variant="outline" 
          size="sm"
          className="mt-2 border-primary/50 text-primary hover:bg-primary/10 font-mono text-xs"
        >
          Join Waitlist
        </Button>
      </div>
    </div>
  );
};
