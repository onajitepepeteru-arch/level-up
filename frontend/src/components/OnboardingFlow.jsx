import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    goals: [],
    bodyType: "",
    activityLevel: "",
    healthConditions: []
  });
  const { toast } = useToast();

  const totalSteps = 6;

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSelection = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      
      const onboardingData = {
        user_id: userId,
        ...formData
      };
      
      const response = await fetch(`${backendUrl}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Welcome to Leveling-Up!",
          description: `Profile completed! You earned ${data.xp_earned || 50} XP for completing onboarding.`
        });
        
        setTimeout(() => {
          onComplete(formData);
        }, 2000);
      } else {
        throw new Error(data.detail || 'Onboarding failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Leveling-Up!</h2>
              <p className="text-gray-600">Let's personalize your fitness journey</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">What's your name?</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="age">How old are you?</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateFormData("age", e.target.value)}
                  placeholder="Enter your age"
                  className="mt-2"
                  min="13"
                  max="100"
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gender</h2>
              <p className="text-gray-600">This helps us personalize your experience</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {["Male", "Female", "Other", "Prefer not to say"].map((gender) => (
                <Button
                  key={gender}
                  variant={formData.gender === gender ? "default" : "outline"}
                  onClick={() => updateFormData("gender", gender)}
                  className="h-16 text-lg"
                >
                  {gender}
                </Button>
              ))}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Fitness Goals</h2>
              <p className="text-gray-600">What do you want to achieve? (Select all that apply)</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                "Lose Weight",
                "Build Muscle",
                "Improve Endurance",
                "Get Stronger",
                "Increase Flexibility",
                "Better Sleep",
                "Reduce Stress",
                "General Health"
              ].map((goal) => (
                <Button
                  key={goal}
                  variant={formData.goals.includes(goal) ? "default" : "outline"}
                  onClick={() => toggleSelection("goals", goal)}
                  className="h-12 justify-start"
                >
                  {goal}
                </Button>
              ))}
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Body Type</h2>
              <p className="text-gray-600">Which describes you best?</p>
            </div>
            
            <div className="space-y-4">
              {[
                { type: "Ectomorph", description: "Naturally lean, fast metabolism" },
                { type: "Mesomorph", description: "Athletic build, gains muscle easily" },
                { type: "Endomorph", description: "Broader build, gains weight easily" },
                { type: "Not Sure", description: "I'm not sure about my body type" }
              ].map(({ type, description }) => (
                <Button
                  key={type}
                  variant={formData.bodyType === type ? "default" : "outline"}
                  onClick={() => updateFormData("bodyType", type)}
                  className="w-full h-auto p-4 justify-start text-left"
                >
                  <div>
                    <div className="font-semibold">{type}</div>
                    <div className="text-sm opacity-70">{description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Level</h2>
              <p className="text-gray-600">How active are you currently?</p>
            </div>
            
            <div className="space-y-4">
              {[
                { level: "Sedentary", description: "Little to no exercise" },
                { level: "Light", description: "Light exercise 1-3 days/week" },
                { level: "Moderate", description: "Moderate exercise 3-5 days/week" },
                { level: "Very Active", description: "Hard exercise 6-7 days/week" },
                { level: "Extremely Active", description: "Very hard exercise, physical job" }
              ].map(({ level, description }) => (
                <Button
                  key={level}
                  variant={formData.activityLevel === level ? "default" : "outline"}
                  onClick={() => updateFormData("activityLevel", level)}
                  className="w-full h-auto p-4 justify-start text-left"
                >
                  <div>
                    <div className="font-semibold">{level}</div>
                    <div className="text-sm opacity-70">{description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Health Conditions</h2>
              <p className="text-gray-600">Do you have any health conditions we should know about? (Optional)</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {[
                "None",
                "Diabetes",
                "Heart Condition",
                "High Blood Pressure", 
                "Asthma",
                "Joint Problems",
                "Back Problems",
                "Other"
              ].map((condition) => (
                <Button
                  key={condition}
                  variant={formData.healthConditions.includes(condition) ? "default" : "outline"}
                  onClick={() => toggleSelection("healthConditions", condition)}
                  className="h-12 justify-start"
                >
                  {condition}
                </Button>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepProgress = () => ((currentStep - 1) / (totalSteps - 1)) * 100;

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.age && parseInt(formData.age) >= 13;
      case 2:
        return formData.gender;
      case 3:
        return formData.goals.length > 0;
      case 4:
        return formData.bodyType;
      case 5:
        return formData.activityLevel;
      case 6:
        return true; // Health conditions are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with Progress */}
        <div className="text-center pt-16 pb-4">
          <h1 className="text-white text-3xl font-bold tracking-wider">Leveling-Up</h1>
          <div className="mt-4 px-6">
            <div className="flex items-center justify-between text-white text-sm mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(getStepProgress())}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
          </div>
          <p className="text-white/80 text-sm mt-2">🔥 Setting up your profile</p>
        </div>

        {/* Onboarding Card */}
        <div className="flex-1 px-6 pb-6">
          <Card className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl h-full flex flex-col">
            <div className="flex-1">
              {renderStep()}
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!isStepValid() || isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? "Completing..." : (currentStep === totalSteps ? "Complete" : "Next")}
                {!isLoading && <ArrowRight size={16} />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;