import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    goals: [],
    bodyType: "",
    activityLevel: "",
    healthConditions: [],
    experience: ""
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to LevelUP!</h2>
              <p className="text-gray-600">Let's personalize your fitness journey</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">What's your name?</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="h-12 rounded-xl mt-2"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="age" className="text-gray-700 font-medium">How old are you?</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  className="h-12 rounded-xl mt-2"
                  placeholder="Enter your age"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
              <p className="text-gray-600">This helps us customize your experience</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Gender</Label>
                <RadioGroup value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                  <div className="grid grid-cols-3 gap-3">
                    <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                      <RadioGroupItem value="male" />
                      <span>Male</span>
                    </Label>
                    <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                      <RadioGroupItem value="female" />
                      <span>Female</span>
                    </Label>
                    <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                      <RadioGroupItem value="other" />
                      <span>Other</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What are your goals?</h2>
              <p className="text-gray-600">Select all that apply to you</p>
            </div>
            <div className="space-y-3">
              {[
                "Lose weight", "Gain muscle", "Improve skin health", 
                "Better nutrition", "Increase flexibility", "Build endurance", 
                "Track posture", "General wellness"
              ].map((goal) => (
                <Label key={goal} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                  <Checkbox 
                    checked={formData.goals.includes(goal)}
                    onCheckedChange={() => toggleArrayField('goals', goal)}
                  />
                  <span className="font-medium">{goal}</span>
                </Label>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Body Type & Activity</h2>
              <p className="text-gray-600">Help us understand your starting point</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label className="text-gray-700 font-medium mb-3 block">Body Type</Label>
                <RadioGroup value={formData.bodyType} onValueChange={(value) => updateFormData('bodyType', value)}>
                  <div className="space-y-3">
                    <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                      <RadioGroupItem value="ectomorph" />
                      <div>
                        <div className="font-medium">Ectomorph</div>
                        <div className="text-sm text-gray-600">Naturally lean, fast metabolism</div>
                      </div>
                    </Label>
                    <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                      <RadioGroupItem value="mesomorph" />
                      <div>
                        <div className="font-medium">Mesomorph</div>
                        <div className="text-sm text-gray-600">Athletic build, gains muscle easily</div>
                      </div>
                    </Label>
                    <Label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                      <RadioGroupItem value="endomorph" />
                      <div>
                        <div className="font-medium">Endomorph</div>
                        <div className="text-sm text-gray-600">Naturally curvy, slower metabolism</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Level</h2>
              <p className="text-gray-600">How active are you currently?</p>
            </div>
            <RadioGroup value={formData.activityLevel} onValueChange={(value) => updateFormData('activityLevel', value)}>
              <div className="space-y-3">
                <Label className="flex items-center space-x-2 cursor-pointer p-4 border rounded-xl hover:bg-gray-50">
                  <RadioGroupItem value="sedentary" />
                  <div>
                    <div className="font-medium">Sedentary</div>
                    <div className="text-sm text-gray-600">Little to no exercise</div>
                  </div>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer p-4 border rounded-xl hover:bg-gray-50">
                  <RadioGroupItem value="light" />
                  <div>
                    <div className="font-medium">Lightly Active</div>
                    <div className="text-sm text-gray-600">1-3 days per week</div>
                  </div>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer p-4 border rounded-xl hover:bg-gray-50">
                  <RadioGroupItem value="moderate" />
                  <div>
                    <div className="font-medium">Moderately Active</div>
                    <div className="text-sm text-gray-600">3-5 days per week</div>
                  </div>
                </Label>
                <Label className="flex items-center space-x-2 cursor-pointer p-4 border rounded-xl hover:bg-gray-50">
                  <RadioGroupItem value="very" />
                  <div>
                    <div className="font-medium">Very Active</div>
                    <div className="text-sm text-gray-600">6-7 days per week</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Almost there!</h2>
              <p className="text-gray-600">Any health considerations?</p>
            </div>
            <div className="space-y-3">
              {[
                "None", "Joint issues", "Back problems", "Heart conditions", 
                "Diabetes", "Skin sensitivity", "Food allergies", "Other"
              ].map((condition) => (
                <Label key={condition} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-xl hover:bg-gray-50">
                  <Checkbox 
                    checked={formData.healthConditions.includes(condition)}
                    onCheckedChange={() => toggleArrayField('healthConditions', condition)}
                  />
                  <span className="font-medium">{condition}</span>
                </Label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch(currentStep) {
      case 1: return formData.name && formData.age;
      case 2: return formData.gender;
      case 3: return formData.goals.length > 0;
      case 4: return formData.bodyType;
      case 5: return formData.activityLevel;
      case 6: return formData.healthConditions.length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with Progress */}
        <div className="pt-16 pb-8 px-6">
          <div className="text-center mb-6">
            <h1 className="text-white text-3xl font-bold tracking-wider mb-2">LevelUP</h1>
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Setting up your profile</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-white/80 text-sm">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>

        {/* Form Card */}
        <div className="flex-1 px-6">
          <Card className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
            {renderStep()}
            
            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
              >
                {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
                {currentStep !== totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;