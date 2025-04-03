import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import WasteClassifier from './components/WasteClassifier';
import Community from './components/Community';
import Profile from './components/Profile';
import TeaserPage from './components/TeaserPage';
import LifestyleSurvey from './components/LifestyleSurvey';
import Welcome from './components/Welcome';
import Introduction from './components/Introduction';
import LocationInput from './components/LocationInput';
import { supabase, withRetry } from './supabase';

function App() {
  const [user, setUser] = useState(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOnboardingStatus = async (userId) => {
    console.log('App: fetchOnboardingStatus called for userId:', userId);
    try {
      console.log('App: Attempting to fetch from Supabase users table');

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase query timed out after 10 seconds')), 10000);
      });

      const fetchPromise = withRetry(() =>
        supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', userId)
          .single()
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.log('App: Supabase query returned an error:', error);
        if (error.code === 'PGRST116') {
          console.log('App: No user row found, creating new row for user:', userId);
          const { error: insertError } = await withRetry(() =>
            supabase
              .from('users')
              .insert({ id: userId, onboarding_completed: false })
          );

          if (insertError) {
            console.error('App: Error creating user row:', insertError.message);
            return false;
          }
          console.log('App: New user row created successfully');
          return false;
        }
        // Check for schema-related errors (e.g., missing column)
        if (error.message.includes('onboarding_completed')) {
          console.error('App: Schema error - onboarding_completed column might be missing:', error.message);
          return false; // Fallback to false if the column is missing
        }
        console.error('App: Error fetching onboarding status:', error.message);
        return false;
      }
      console.log('App: Fetched onboarding status:', data?.onboarding_completed);
      return data?.onboarding_completed || false;
    } catch (err) {
      console.error('App: Unexpected error in fetchOnboardingStatus:', err.message);
      return false;
    }
  };

  const refreshOnboardingStatus = async () => {
    console.log('App: refreshOnboardingStatus called');
    if (user) {
      try {
        const status = await fetchOnboardingStatus(user.id);
        setOnboardingCompleted(status);
      } catch (err) {
        console.error('App: Error in refreshOnboardingStatus:', err.message);
        setOnboardingCompleted(false);
      }
    } else {
      console.log('App: No user to refresh onboarding status for');
    }
  };

  useEffect(() => {
    console.log('App: useEffect started');
    const checkUserAndOnboarding = async () => {
      console.log('App: checkUserAndOnboarding called');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('App: Error fetching user:', userError.message);
          setUser(null);
          setOnboardingCompleted(false);
          return;
        }
        console.log('App: User fetched:', user ? user.id : 'No user');
        setUser(user);

        if (user) {
          try {
            const status = await fetchOnboardingStatus(user.id);
            setOnboardingCompleted(status);
          } catch (fetchError) {
            console.error('App: Error fetching onboarding status in checkUserAndOnboarding:', fetchError.message);
            setOnboardingCompleted(false);
          }
        } else {
          setOnboardingCompleted(null);
        }
      } catch (err) {
        console.error('App: Error in checkUserAndOnboarding:', err.message);
        setOnboardingCompleted(false);
      } finally {
        console.log('App: Setting loading to false in checkUserAndOnboarding');
        setLoading(false);
      }
    };

    checkUserAndOnboarding();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App: onAuthStateChange triggered, event:', event);
      try {
        const newUser = session?.user || null;
        setUser(newUser);
        console.log('App: Auth state changed, user:', newUser ? newUser.id : 'No user');

        if (newUser) {
          try {
            const status = await fetchOnboardingStatus(newUser.id);
            setOnboardingCompleted(status);
          } catch (fetchError) {
            console.error('App: Error fetching onboarding status in onAuthStateChange:', fetchError.message);
            setOnboardingCompleted(false);
          }
        } else {
          setOnboardingCompleted(null);
        }
      } catch (err) {
        console.error('App: Error in onAuthStateChange:', err.message);
        setOnboardingCompleted(false);
      } finally {
        console.log('App: Setting loading to false in onAuthStateChange');
        setLoading(false);
      }
    });

    return () => {
      console.log('App: Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to={onboardingCompleted ? '/dashboard' : '/welcome'} /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={onboardingCompleted ? '/dashboard' : '/welcome'} /> : <Signup />} />
        <Route path="/welcome" element={user ? (onboardingCompleted ? <Navigate to="/dashboard" /> : <Welcome refreshOnboardingStatus={refreshOnboardingStatus} />) : <Navigate to="/" />} />
        <Route path="/introduction" element={user ? (onboardingCompleted ? <Navigate to="/dashboard" /> : <Introduction refreshOnboardingStatus={refreshOnboardingStatus} />) : <Navigate to="/" />} />
        <Route path="/location" element={user ? (onboardingCompleted ? <Navigate to="/dashboard" /> : <LocationInput refreshOnboardingStatus={refreshOnboardingStatus} />) : <Navigate to="/" />} />
        <Route path="/dashboard" element={user ? (onboardingCompleted ? <Dashboard /> : <Navigate to="/welcome" />) : <Navigate to="/" />} />
        <Route path="/classify" element={user ? (onboardingCompleted ? <WasteClassifier /> : <Navigate to="/welcome" />) : <Navigate to="/" />} />
        <Route path="/community" element={user ? (onboardingCompleted ? <Community /> : <Navigate to="/welcome" />) : <Navigate to="/" />} />
        <Route path="/profile" element={user ? (onboardingCompleted ? <Profile /> : <Navigate to="/welcome" />) : <Navigate to="/" />} />
        <Route path="/teaser" element={user ? (onboardingCompleted ? <TeaserPage /> : <Navigate to="/welcome" />) : <Navigate to="/" />} />
        <Route path="/lifestyle-survey" element={user ? (onboardingCompleted ? <LifestyleSurvey /> : <Navigate to="/welcome" />) : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;