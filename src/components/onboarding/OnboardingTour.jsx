import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ArrowLeft, Sparkles, Target } from "lucide-react";

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const tourSteps = [
    {
      target: '[data-tour="marketplace-search"]',
      title: "Welcome to GarageSale! 🎉",
      content: "Let's take a quick tour to show you how everything works. First, use this search bar to find amazing items from your local community.",
      position: "bottom",
      pulse: true
    },
    {
      target: '[data-tour="filters"]',
      title: "Smart Filters",
      content: "Filter by category, price range, or toggle 'Free Items' to find exactly what you're looking for.",
      position: "bottom",
      pulse: true
    },
    {
      target: '[data-tour="item-card"]',
      title: "Item Cards",
      content: "Each item shows photos, price, seller info, and condition. Click 'Buy' to purchase or 'Make Offer' to propose a trade!",
      position: "top",
      pulse: true
    },
    {
      target: '[data-tour="trade-button"]',
      title: "Trading System",
      content: "This is where the magic happens! Instead of just buying, you can offer your own items in trade. It's like modern bartering!",
      position: "top",
      pulse: true,
      highlight: "orange"
    },
    {
      target: '[data-tour="sidebar-my-items"]',
      title: "Your Inventory",
      content: "Click here to manage your listings. These items become your 'trading currency' - you can offer them in trades with other users.",
      position: "right",
      pulse: true
    },
    {
      target: '[data-tour="sidebar-add-item"]',
      title: "List New Items",
      content: "Add items you want to sell or trade. Our AI assistant can help write descriptions and suggest prices!",
      position: "right",
      pulse: true
    },
    {
      target: '[data-tour="sidebar-trade-offers"]',
      title: "Trade Offers",
      content: "See all your incoming and outgoing trade proposals. Remember: offers expire in 60 minutes, so check regularly!",
      position: "right",
      pulse: true,
      highlight: "purple"
    },
    {
      target: '[data-tour="sidebar-requests"]',
      title: "Service Requests",
      content: "Need work done? Post requests for services like cleaning, repairs, or tutoring. Local providers can respond with quotes.",
      position: "right",
      pulse: true
    }
  ];

  const currentStepData = tourSteps[currentStep];

  useEffect(() => {
    if (!isVisible || !currentStepData) return;

    // Clean up previous step's pulse effect first
    const previousStep = tourSteps[currentStep - 1];
    if (previousStep) {
      const prevTarget = document.querySelector(previousStep.target);
      if (prevTarget) {
        prevTarget.classList.remove('onboarding-pulse', 'onboarding-pulse-orange', 'onboarding-pulse-purple');
      }
    }

    const targetElement = document.querySelector(currentStepData.target);
    if (targetElement) {
      // Add pulsing animation
      if (currentStepData.pulse) {
        targetElement.classList.add('onboarding-pulse');
        if (currentStepData.highlight === 'orange') {
          targetElement.classList.add('onboarding-pulse-orange');
        } else if (currentStepData.highlight === 'purple') {
          targetElement.classList.add('onboarding-pulse-purple');
        }
      }

      // Scroll into view
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }

    return () => {
      // Clean up the current element when the tour step changes or unmounts
      if (targetElement) {
        targetElement.classList.remove('onboarding-pulse', 'onboarding-pulse-orange', 'onboarding-pulse-purple');
      }
    };
  }, [currentStep, isVisible]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    // Clean up all animations just in case
    const allElements = document.querySelectorAll('.onboarding-pulse');
    allElements.forEach(el => {
      el.classList.remove('onboarding-pulse', 'onboarding-pulse-orange', 'onboarding-pulse-purple');
    });
    // Mark tour as completed in localStorage
    localStorage.setItem('garagesale-tour-completed', 'true');
    onComplete?.();
  };

  const skipTour = () => {
    completeTour();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
      
      {/* Tooltip */}
      <div className="fixed z-[60]" style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <Card className="bg-gray-900 border-2 border-pink-500 shadow-2xl max-w-md w-full mx-4">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <Badge className="bg-pink-900/50 text-pink-300 border-pink-700">
                  Step {currentStep + 1} of {tourSteps.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <h3 className="text-xl font-bold text-white mb-3">
              {currentStepData.title}
            </h3>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              {currentStepData.content}
            </p>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-pink-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSS for pulsing animations */}
      <style jsx global>{`
        .onboarding-pulse {
          position: relative;
          z-index: 55;
        }
        
        .onboarding-pulse::before {
          content: '';
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border: 3px solid #ec4899;
          border-radius: 12px;
          animation: pulse-pink 2s infinite;
          pointer-events: none;
          z-index: -1;
        }
        
        .onboarding-pulse-orange::before {
          border-color: #f97316;
          animation: pulse-orange 2s infinite;
        }
        
        .onboarding-pulse-purple::before {
          border-color: #8b5cf6;
          animation: pulse-purple 2s infinite;
        }
        
        @keyframes pulse-pink {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
        
        @keyframes pulse-orange {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.08);
            box-shadow: 0 0 0 10px rgba(249, 115, 22, 0);
          }
        }
        
        @keyframes pulse-purple {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.08);
            box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
          }
        }
      `}</style>
    </>
  );
};

export default OnboardingTour;