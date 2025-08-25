import React from 'react'
// Add these imports at the top:
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// components/UserTypeCard.tsx
interface UserTypeCardProps {
  type: 'child' | 'adult' | 'guardian';
  title: string;
  description: string;
  avatar: React.ReactNode;
  features: string[];
  ctaText: string;
  href: string;
}

export function UserTypeCard({ type, title, description, avatar, features, ctaText, href }: UserTypeCardProps) {
  const colorSchemes = {
    child: 'from-pink-500 to-purple-500',
    adult: 'from-blue-500 to-indigo-500', 
    guardian: 'from-green-500 to-teal-500'
  };

  return (
    <Card className="relative overflow-hidden hover:scale-105 transition-transform duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorSchemes[type]} opacity-5`} />
      <CardContent className="p-8 text-center relative">
        <div className="mb-6">
          {avatar}
        </div>
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        
        <ul className="space-y-2 mb-8 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <span className="mr-2">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Link href={href}>
          <Button className={`w-full bg-gradient-to-r ${colorSchemes[type]} text-white`}>
            {ctaText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}