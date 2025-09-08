import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  AcademicCapIcon,
  BoltIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  TrophyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Quiz Generation',
      description: 'Upload any document and let our AI create engaging quizzes instantly'
    },
    {
      icon: UsersIcon,
      title: 'Multiplayer Competitions',
      description: 'Create live quiz rooms and compete with friends or colleagues'
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Track your progress with detailed performance insights'
    },
    {
      icon: ClockIcon,
      title: 'Daily Practice',
      description: 'Personalized daily quizzes to maintain your learning streak'
    },
    {
      icon: TrophyIcon,
      title: 'Gamification',
      description: 'Earn badges, climb leaderboards, and unlock achievements'
    },
    {
      icon: BoltIcon,
      title: 'Smart Learning',
      description: 'Adaptive difficulty and personalized question recommendations'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Quizzes Created' },
    { number: '100K+', label: 'Questions Generated' },
    { number: '25K+', label: 'Active Users' },
    { number: '98%', label: 'User Satisfaction' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Transform Documents into
              <span className="block bg-gradient-to-r from-accent-300 to-white bg-clip-text text-transparent">
                Interactive Quizzes
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Upload any PDF or document and let AI create engaging quizzes instantly. 
              Practice solo or compete with friends in real-time multiplayer sessions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button 
                  variant="accent" 
                  size="lg" 
                  className="bg-white text-primary-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Get Started Free
                </Button>
              </Link>
              <Link to="/demo">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200"
                >
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-accent-400 rounded-full opacity-20 animate-pulse-slow"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-secondary-400 rounded-full opacity-20 animate-pulse-slow delay-1000"></div>
          <div className="absolute bottom-40 left-20 w-24 h-24 bg-primary-400 rounded-full opacity-20 animate-pulse-slow delay-2000"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Smart Learning
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to make learning engaging, efficient, and fun
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 3-step process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                1. Upload Document
              </h3>
              <p className="text-slate-600">
                Upload any PDF, DOCX, or text file containing the content you want to quiz on
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                2. AI Generates Quiz
              </h3>
              <p className="text-slate-600">
                Our AI analyzes your content and creates engaging questions with multiple choice options
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                3. Take Quiz & Learn
              </h3>
              <p className="text-slate-600">
                Practice solo, compete with friends, or join multiplayer rooms for interactive learning
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of learners who are already using AI to make studying more effective and enjoyable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}>
              <Button 
                variant="accent" 
                size="lg" 
                className="bg-white text-primary-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Start Creating Quizzes
              </Button>
            </Link>
            <Link to="/contact">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
