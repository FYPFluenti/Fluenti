// src/components/FeatureCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactElement<LucideIcon>;
  title: string;
  description: string;
  gradient?: string;
}

export default function FeatureCard({ 
  icon, 
  title, 
  description, 
  gradient = "from-primary to-secondary" 
}: FeatureCardProps) {
  return (
    <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-lg border-0 bg-white/50 backdrop-blur">
      <CardContent className="p-8 text-center">
        {/* Icon Container */}
        <div className={`
          w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${gradient} 
          flex items-center justify-center group-hover:scale-110 transition-transform duration-300
        `}>
          <div className="text-white text-2xl">
            {icon}
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}