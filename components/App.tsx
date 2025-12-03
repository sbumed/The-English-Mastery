
import React, { useState, useEffect } from 'react';
import Conversation from './components/Conversation';
import Vocabulary from './components/Vocabulary';
import QnA from './components/QnA';
import ImageGenerator from './components/ImageGenerator';
import Translate from './components/Translate';
import HomeworkHelper from './components/HomeworkHelper';
import VideoLessons from './components/VideoLessons';
import AnimateImage from './components/AnimateImage';
import { ChatIcon } from './components/icons/ChatIcon';
import { BookIcon } from './components/icons/BookIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { LogoIcon } from './components/icons/LogoIcon';
import { LanguageIcon } from './components/icons/LanguageIcon';
import { StarIcon } from './components/icons/StarIcon';
import { HomeworkIcon } from './components/icons/HomeworkIcon';
import { VideoIcon } from './components/icons/VideoIcon';
import { MovieIcon } from './components/icons/MovieIcon';

type Tab = 'conversation' | 'vocabulary' | 'qna' | 'image' | 'translate' | 'homework' | 'video' | 'animate';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('conversation');
  const [displayedTab, setDisplayedTab] = useState<Tab>(activeTab);
  const [animationClass, setAnimationClass] = useState('fade-in');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Daily Reward State
  const [stars, setStars] = useState(0);
  const [showRewardModal, setShowRewardModal] = useState(false);

  useEffect(() => {
    // Check daily login
    const storedStars = parseInt(localStorage.getItem('app_stars') || '0', 10);
    const lastLoginDate = localStorage.getItem('last_login_date');
    const today = new Date().toDateString();

    if (lastLoginDate !== today) {
        // It's a new day (or first login)
        const newStars = storedStars + 1;
        setStars(newStars);
        localStorage.setItem('app_stars', newStars.toString());
        localStorage.setItem('last_login_date', today);
        
        // Show reward modal
        setShowRewardModal(true);
        // Hide modal automatically after 3 seconds
        setTimeout(() => {
            setShowRewardModal(false);
        }, 3500);
    } else {
        // Already logged in today
        setStars(storedStars);
    }
  }, []);

  const renderTabContent = () => {
    switch (displayedTab) {
      case 'conversation':
        return <Conversation />;
      case 'vocabulary':
        return <Vocabulary />;
      case 'qna':
        return <QnA />;
      case 'image':
        return <ImageGenerator />;
      case 'translate':
        return <Translate />;
      case 'homework':
        return <HomeworkHelper />;
      case 'video':
        return <VideoLessons />;
      case 'animate':
        return <AnimateImage />;
      default:
        return null;
    }
  };
  
  const handleTabChange = (tabName: Tab) => {
    if (tabName === activeTab || isTransitioning) return;

    setIsTransitioning(true);
    setAnimationClass('fade-out');

    setTimeout(() => {
        setActiveTab(tabName);
        setDisplayedTab(tabName);
        setAnimationClass('fade-in');
        setIsTransitioning(false);
    }, 300); // Match animation duration
  };

  const NavButton = ({ tabName, label, icon }: { tabName: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => handleTabChange(tabName)}
      disabled={isTransitioning}
      className={`group flex-1 relative flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-2xl transition-all duration-300 ease-out min-w-[4rem]
        ${activeTab === tabName 
            ? 'text-white' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
        }
        ${isTransitioning ? 'cursor-not-allowed opacity-70' : ''}
      `}
    >
      {/* Active background pill */}
      {activeTab === tabName && (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl shadow-lg shadow-violet-500/30 -z-10 animate-fade-in" />
      )}
      
      <div className={`transition-transform duration-300 ${activeTab === tabName ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium tracking-wide transition-opacity duration-300 ${activeTab === tabName ? 'opacity-100' : 'opacity-70 hidden sm:block'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden selection:bg-violet-200 dark:selection:bg-violet-900/50 relative">
      
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-fuchsia-500/10 dark:bg-fuchsia-500/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Daily Reward Modal */}
      {showRewardModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/20">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-white/20 ring-1 ring-black/5 flex flex-col items-center animate-fade-in transform transition-all scale-100 max-w-sm w-full relative overflow-hidden">
                  {/* Confetti background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent opacity-50" />
                  
                  <div className="bg-gradient-to-br from-amber-300 to-yellow-500 p-5 rounded-full mb-6 shadow-lg shadow-yellow-500/30 relative z-10">
                    <StarIcon className="w-12 h-12 text-white animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 relative z-10">Daily Bonus!</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-center mb-6 leading-relaxed relative z-10">
                    You're on fire! 🔥 <br/> Here is <span className="font-bold text-yellow-500">+1 Star</span> for practicing today.
                  </p>
                  <button 
                    onClick={() => setShowRewardModal(false)}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-violet-500/30 transition-all transform hover:scale-[1.02] active:scale-95 relative z-10"
                  >
                      Awesome!
                  </button>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-20 px-4 py-3 md:py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 ring-2 ring-white dark:ring-slate-800">
                    <LogoIcon className="w-6 h-6 text-white" />
                 </div>
                <div>
                    <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">The English Mastery</h1>
                    <p className="text-[10px] md:text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">AI Tutor</p>
                </div>
            </div>
            
            {/* Stars Counter */}
            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-md">
                <StarIcon className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
                <span className="text-slate-800 dark:text-slate-100 font-bold text-sm md:text-base tabular-nums">{stars}</span>
            </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-3 sm:p-6 relative z-10">
        <div className={`max-w-7xl mx-auto h-full flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-white/50 dark:border-slate-800 overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5 ${animationClass}`}>
          {renderTabContent()}
        </div>
      </main>

      {/* Navigation Bar */}
      <footer className="p-4 pb-6 bg-transparent z-20">
        <nav className="max-w-5xl mx-auto flex items-center justify-between gap-1 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-400/20 dark:shadow-black/40 border border-white/50 dark:border-slate-800 ring-1 ring-slate-900/5 overflow-x-auto">
          <NavButton tabName="conversation" label="Practice" icon={<ChatIcon className="w-5 h-5 md:w-6 md:h-6" />} />
          <NavButton tabName="vocabulary" label="Dictionary" icon={<BookIcon className="w-5 h-5 md:w-6 md:h-6" />} />
          <NavButton tabName="translate" label="Translate" icon={<LanguageIcon className="w-5 h-5 md:w-6 md:h-6" />} />
          <NavButton tabName="qna" label="Ask AI" icon={<SparklesIcon className="w-5 h-5 md:w-6 md:h-6" />} />
          <NavButton tabName="image" label="Flashcard" icon={<ImageIcon className="w-5 h-5 md:w-6 md:h-6" />} />
          <NavButton tabName="homework" label="Homework" icon={<HomeworkIcon className="w-5 h-5 md:w-6 md:h-6" />} />
          <NavButton tabName="video" label="Lessons" icon={<VideoIcon className="w-5 h-5 md:w-6 md:h-6" />} />
          <NavButton tabName="animate" label="Animate" icon={<MovieIcon className="w-5 h-5 md:w-6 md:h-6" />} />
        </nav>
      </footer>
    </div>
  );
};

export default App;
