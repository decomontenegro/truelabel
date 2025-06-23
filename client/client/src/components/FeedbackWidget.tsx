import React, { useState } from 'react';
import { MessageSquare, X, Send, Bug, Lightbulb, Heart } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackData {
  type: FeedbackType;
  message: string;
  email?: string;
  pageUrl: string;
  userAgent: string;
  timestamp: string;
}

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const feedbackData: FeedbackData = {
        type,
        message,
        email: user?.email || email,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      await api.post('/feedback', feedbackData);
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setMessage('');
        setEmail('');
        setType('general');
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    { value: 'bug', label: 'Report Bug', icon: Bug, color: 'text-red-500' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-500' },
    { value: 'general', label: 'General Feedback', icon: Heart, color: 'text-blue-500' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-50"
        aria-label="Open feedback form"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl z-50 animate-slideUp">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Send Feedback</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close feedback form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isSuccess ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p className="text-gray-700 font-medium">Thank you for your feedback!</p>
          <p className="text-gray-500 text-sm mt-1">We'll review it shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4">
          {/* Feedback Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's on your mind?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {feedbackTypes.map((feedbackType) => {
                const Icon = feedbackType.icon;
                return (
                  <button
                    key={feedbackType.value}
                    type="button"
                    onClick={() => setType(feedbackType.value as FeedbackType)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      type === feedbackType.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${feedbackType.color}`} />
                    <span className="text-xs text-gray-700">{feedbackType.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Your feedback
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder={
                type === 'bug'
                  ? 'Describe the issue you encountered...'
                  : type === 'feature'
                  ? 'Describe the feature you would like...'
                  : 'Share your thoughts with us...'
              }
              required
            />
          </div>

          {/* Email Input (only if not logged in) */}
          {!user && (
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
              isSubmitting || !message.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Feedback</span>
              </>
            )}
          </button>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            Your feedback helps us improve. We respect your privacy.
          </p>
        </form>
      )}
    </div>
  );
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;
document.head.appendChild(style);