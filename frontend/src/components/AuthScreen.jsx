import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import GoogleLogin from "./GoogleLogin";
import AppleLogin from "./AppleLogin";

const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      
      const requestData = isLogin 
        ? { email, password }
        : { name, email, password };
      
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || (isLogin ? "Logged in successfully!" : "Account created successfully!")
        });
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('token', data.token);
        
        setTimeout(() => {
          onLogin(isLogin);
        }, 1000);
      } else {
        throw new Error(data.detail || 'Authentication failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSuccess = (user) => {
    toast({
      title: "Success",
      description: "Logged in successfully!"
    });
    
    setTimeout(() => {
      onLogin(true); // Social login is treated as existing user
    }, 1000);
  };

  const handleSocialError = (error) => {
    toast({
      title: "Social Login Failed",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center pt-16 pb-8">
          <h1 className="text-white text-4xl font-bold tracking-wider">Leveling-Up</h1>
          <p className="text-white/80 text-sm mt-2">Your Fitness Journey Starts Here</p>
        </div>

        {/* Auth Card */}
        <div className="flex-1 px-6">
          <Card className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? "Welcome back! Please log in using the form below to continue."
                  : "Join Leveling-Up and start your fitness journey today!"
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isLoading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
              </Button>
            </form>

            <div className="mt-8">
              <div className="text-center text-gray-500 mb-6">Or sign up with</div>
              
              <div className="space-y-4">
                <GoogleLogin 
                  onSuccess={handleSocialSuccess}
                  onError={handleSocialError}
                />

                <AppleLogin 
                  onSuccess={handleSocialSuccess}
                  onError={handleSocialError}
                />
              </div>
            </div>

            <div className="mt-8 text-center">
              <span className="text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                {isLogin ? "Sign Up here" : "Log in here"}
              </button>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-white/80 text-sm">
            <span>© 2025 Leveling-Up</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;