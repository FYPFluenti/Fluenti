import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { MessageCircle, User, Shield, Star } from "lucide-react";

export function RoleBasedHeader() {
  const { user } = useAuth();
  const userType = (user as any)?.userType;

  const getDashboardLink = () => {
    switch (userType) {
      case 'child': return '/child-dashboard';
      case 'adult': return '/adult-dashboard';
      case 'guardian': return '/guardian-dashboard';
      default: return '/';
    }
  };

  const getAppName = () => {
    switch (userType) {
      case 'child': return 'Fluenti Kids';
      case 'guardian': return 'Fluenti Guardian';
      default: return 'Fluenti';
    }
  };

  const getAppIcon = () => {
    switch (userType) {
      case 'child': return <Star className="text-pink-500 text-lg" />;
      case 'guardian': return <Shield className="text-green-600 text-lg" />;
      default: return <MessageCircle className="text-white text-lg" />;
    }
  };

  const getHeaderColor = () => {
    switch (userType) {
      case 'child': return 'from-pink-400 to-purple-500';
      case 'guardian': return 'from-green-500 to-teal-600';
      default: return 'from-primary to-secondary';
    }
  };

  const getBadgeColor = () => {
    switch (userType) {
      case 'child': return 'bg-pink-100 text-pink-700';
      case 'guardian': return 'bg-green-100 text-green-700';
      default: return '';
    }
  };

  const getTextColor = () => {
    switch (userType) {
      case 'child': return 'text-purple-600';
      case 'guardian': return 'text-green-600';
      default: return 'text-primary';
    }
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href={getDashboardLink()}>
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className={`w-10 h-10 bg-gradient-to-br ${getHeaderColor()} rounded-xl flex items-center justify-center`}>
                {getAppIcon()}
              </div>
              <span className={`text-2xl font-bold ${getTextColor()}`}>
                {getAppName()}
              </span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="text-sm text-gray-600">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </span>
            </div>
            <Badge variant="outline" className={getBadgeColor()}>
              {userType === 'child' ? 'Child' : userType === 'guardian' ? 'Guardian' : 'Adult'}
            </Badge>
            <Button variant="outline" size="sm">
              <Link href="/api/logout">Logout</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
