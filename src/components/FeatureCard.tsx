import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group relative overflow-hidden border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(255,69,0,0.1)] [-webkit-transform:skewX(-3deg)] [transform:skewX(-3deg)]">
      {/* Scan line effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Corner accent */}
      <div className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-primary opacity-50" />
      <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-primary opacity-50" />
      
      <div className="relative [transform:skewX(3deg)]">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border border-primary/30 bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        
        <h3 className="mb-2 font-mono text-lg font-bold uppercase tracking-wider text-foreground">
          {title}
        </h3>
        
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
};
