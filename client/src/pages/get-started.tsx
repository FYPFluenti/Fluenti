import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserData {
  type: string;
  goals: string[];
  experience: string;
}

export default function GetStarted() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    type: '',
    goals: [],
    experience: ''
  });

  const UserTypeSelection = ({ onNext }: { onNext: (type: string) => void }) => (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={() => onNext('child')} className="w-full">Child</Button>
          <Button onClick={() => onNext('adult')} className="w-full">Adult</Button>
          {/* Guardian option hidden - feature not currently active */}
        </div>
      </CardContent>
    </Card>
  );

  const GoalsSelection = ({ userType, onNext }: { 
    userType: string; 
    onNext: (goals: string[]) => void 
  }) => (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Goals for {userType}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => onNext(['speaking', 'listening'])} className="w-full">
          Continue with Default Goals
        </Button>
      </CardContent>
    </Card>
  );

  const ExperienceLevel = ({ onNext }: { onNext: (experience: string) => void }) => (
    <Card>
      <CardHeader>
        <CardTitle>Experience Level</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={() => onNext('beginner')} className="w-full">Beginner</Button>
          <Button onClick={() => onNext('intermediate')} className="w-full">Intermediate</Button>
          <Button onClick={() => onNext('advanced')} className="w-full">Advanced</Button>
        </div>
      </CardContent>
    </Card>
  );

  const CreateAccount = ({ userData }: { userData: UserData }) => (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p><strong>Type:</strong> {userData.type}</p>
          <p><strong>Goals:</strong> {userData.goals.length > 0 ? userData.goals.join(', ') : 'None selected'}</p>
          <p><strong>Experience:</strong> {userData.experience}</p>
        </div>
        <Button className="w-full mt-4">Create Account</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Progress Bar */}
      <div className="w-full bg-white/50 h-1">
        <div 
          className="h-1 bg-blue-600 transition-all duration-500"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {step === 1 && (
          <UserTypeSelection 
            onNext={(type) => {
              setUserData(prev => ({...prev, type}));
              setStep(2);
            }}
          />
        )}
        
        {step === 2 && (
          <GoalsSelection 
            userType={userData.type}
            onNext={(goals) => {
              setUserData(prev => ({...prev, goals}));
              setStep(3);
            }}
          />
        )}
        
        {step === 3 && (
          <ExperienceLevel 
            onNext={(experience) => {
              setUserData(prev => ({...prev, experience}));
              setStep(4);
            }}
          />
        )}
        
        {step === 4 && (
          <CreateAccount userData={userData} />
        )}
      </div>
    </div>
  );
}