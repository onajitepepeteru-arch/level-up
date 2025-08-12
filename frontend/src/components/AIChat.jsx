import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { 
  Send, 
  Bot, 
  User, 
  Crown, 
  Sparkles,
  ArrowLeft,
  Zap
} from "lucide-react";
import { mockUser } from "../mock";
import { useToast } from "../hooks/use-toast";

const AIChat = ({ onBack }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hey ${mockUser.name}! 🔥 I'm your personal AI fitness coach. I've analyzed your Level ${mockUser.level} profile and I'm here to help you reach your goals! What would you like to work on today?`,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage) => {
    const responses = [
      `Based on your Level ${mockUser.level} progress, I recommend focusing on consistency. Your ${mockProgress.daily}% daily completion is great! Let's aim for 80%+ this week.`,
      
      `I see you're interested in body scanning! Your mesomorph body type responds well to strength training. Should we create a personalized workout plan?`,
      
      `Your XP progress shows you're ${Math.round((mockUser.xp / mockUser.xpToNextLevel) * 100)}% to Level ${mockUser.level + 1}! Complete 2 more missions today to boost your progress.`,
      
      `Nutrition tip: Based on your goals, try increasing protein intake to 1.2g per kg of body weight. Your recent food scans show room for improvement!`,
      
      `Great question! Your skin analysis suggests focusing on hydration and SPF. I can create a personalized routine based on your combination skin type.`,
      
      `Your posture scan detected slight forward head tilt. I recommend 5-minute neck exercises daily. Want me to show you the routine?`,
      
      `You're doing amazing! Your consistency streak is impressive. Remember, small daily improvements lead to big transformations. What's your biggest challenge right now?`
    ];
    
    const contextualResponses = {
      "workout": `Perfect! Based on your mesomorph body type and Level ${mockUser.level}, here's a targeted plan:\n\n💪 **Strength Training (3x/week)**\n- Compound movements: squats, deadlifts\n- Progressive overload: +5lbs weekly\n\n🔥 **Cardio (2x/week)**\n- HIIT sessions: 20 minutes\n- Heart rate: 70-85% max\n\nThis plan will boost your XP and get you to Level ${mockUser.level + 1} faster!`,
      
      "nutrition": `Based on your food scans, here's your personalized nutrition plan:\n\n🥗 **Daily Targets:**\n- Calories: 2,200-2,400\n- Protein: 165g (30%)\n- Carbs: 275g (50%)\n- Fats: 55g (20%)\n\n✨ **Pro Tips:**\n- Eat protein within 30min post-workout\n- Stay hydrated: 3L water daily\n- Track with our food scanner for +5 XP per meal!`,
      
      "skin": `Your face scan results show combination skin. Here's your glow-up routine:\n\n🌅 **Morning:**\n- Gentle cleanser\n- Niacinamide serum\n- SPF 50+ sunscreen\n\n🌙 **Evening:**\n- Double cleanse\n- Retinol (2x/week)\n- Moisturizer\n\nConsistency = results! Track daily for +6 XP.`
    };
    
    // Check for keywords to provide contextual responses
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes("workout") || lowerMessage.includes("exercise") || lowerMessage.includes("training")) {
      return contextualResponses.workout;
    } else if (lowerMessage.includes("food") || lowerMessage.includes("nutrition") || lowerMessage.includes("diet") || lowerMessage.includes("eat")) {
      return contextualResponses.nutrition;
    } else if (lowerMessage.includes("skin") || lowerMessage.includes("face") || lowerMessage.includes("skincare")) {
      return contextualResponses.skin;
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: generateAIResponse(inputMessage),
        sender: "ai",
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const quickActions = [
    "Create workout plan",
    "Analyze my progress", 
    "Nutrition advice",
    "Skincare routine"
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">AI Fitness Coach</h2>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Online</span>
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <Badge className="bg-purple-100 text-purple-700">PRO</Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-100' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  <p className="whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              onClick={() => setInputMessage(action)}
              className="rounded-full whitespace-nowrap text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {action}
            </Button>
          ))}
        </div>
        
        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask your AI coach anything..."
            className="flex-1 rounded-xl h-12"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;