import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox';
import api from '../api/axiosConfig';
import {
  UserIcon, 
  CameraIcon, 
  TrophyIcon, 
  FireIcon,
  ChartBarIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    avatar: null
  });
  const [stats, setStats] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [settings, setSettings] = useState({
    email_notifications: true,
    daily_practice_enabled: true,
    public_profile: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [profileRes, statsRes, bookmarksRes, attemptsRes] = await Promise.all([
        api.get('/users/profile/'),
        api.get('/users/stats/'),
        api.get('/quiz/bookmarks/'),
        api.get('/quiz/attempts/')
      ]);

      setProfileData(profileRes.data);
      setStats(statsRes.data);
      setBookmarks(bookmarksRes.data.results || []);
      setSettings({
        email_notifications: profileRes.data.email_notifications,
        daily_practice_enabled: profileRes.data.daily_practice_enabled,
        public_profile: profileRes.data.public_profile || false
      });
      setAttempts(attemptsRes.data.attempts || []);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== '') {
          formData.append(key, profileData[key]);
        }
      });

      await updateProfile(formData);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    try {
      await api.post('/users/change-password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to update password');
    }
  };

  const handleSettingsUpdate = async (settingKey, value) => {
    try {
      await api.patch('/users/profile/', { [settingKey]: value });
      setSettings(prev => ({ ...prev, [settingKey]: value }));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData(prev => ({ ...prev, avatar: file }));
    }
  };

  const removeBookmark = async (bookmarkId) => {
    try {
      await api.delete(`/quiz/bookmarks/${bookmarkId}/`);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'stats', name: 'Statistics', icon: ChartBarIcon },
    { id: 'bookmarks', name: 'Bookmarks', icon: BookmarkIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mx-auto mb-4">
                  {profileData.avatar ? (
                    <img 
                      src={URL.createObjectURL(profileData.avatar)} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-10 h-10 text-white" />
                  )}
                </div>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                  <CameraIcon className="w-4 h-4 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {profileData.first_name} {profileData.last_name}
              </h2>
              <p className="text-slate-600">{profileData.email}</p>
            </div>

            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Profile Information
              </h2>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Your Statistics
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrophyIcon className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {stats?.total_points || 0}
                    </div>
                    <div className="text-slate-600">Total Points</div>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FireIcon className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {stats?.current_streak || 0}
                    </div>
                    <div className="text-slate-600">Current Streak</div>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChartBarIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {stats?.average_score || 0}%
                    </div>
                    <div className="text-slate-600">Average Score</div>
                  </div>
                </div>
              </Card>

              {/* Badges */}
              {stats?.badges && stats.badges.length > 0 && (
                <Card>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Your Badges
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.badges.map((badge, index) => (
                      <div key={index} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <TrophyIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="font-semibold text-slate-900 text-sm">
                          {badge.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          {badge.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Bookmarks Tab */}
          {activeTab === 'bookmarks' && (
            <Card>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Bookmarked Questions
              </h2>
              
              {bookmarks.length > 0 ? (
                <div className="space-y-4">
                  {bookmarks.map(bookmark => (
                    <div key={bookmark.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-2">
                            {bookmark.quiz_title}
                          </h3>
                          <p className="text-slate-700 mb-2">
                            {bookmark.question.question_text}
                          </p>
                          {bookmark.notes && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-blue-800 text-sm">
                                <strong>Notes:</strong> {bookmark.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBookmark(bookmark.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookmarkIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No bookmarked questions yet</p>
                </div>
              )}
            </Card>
          )}

          {/* Quiz History */}
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Quiz History</h2>
              <Link to="/recent-quizzes" className="text-blue-600 underline">View All</Link>
            </div>
            {attempts.length === 0 ? (
              <div className="text-sm text-slate-600">No attempts yet.</div>
            ) : (
              <div className="space-y-3">
                {attempts.slice(0, 5).map(a => (
                  <div key={a.attempt_id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.quiz_title}</div>
                      <div className="text-sm text-slate-600">{a.quiz_type} • {a.quiz_difficulty} • {a.total_questions} questions</div>
                    </div>
                    <Link to={`/attempts/${a.attempt_id}`} className="text-blue-600 underline">Details</Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Account Settings
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <BellIcon className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-900">Email Notifications</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Receive email notifications for quiz results and achievements
                    </p>
                  </div>
                  <AnimatedCheckbox
                    checked={settings.email_notifications}
                    onChange={(e) => handleSettingsUpdate('email_notifications', e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <FireIcon className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-900">Daily Practice</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Enable daily practice quizzes to maintain your learning streak
                    </p>
                  </div>
                  <AnimatedCheckbox
                    checked={settings.daily_practice_enabled}
                    onChange={(e) => handleSettingsUpdate('daily_practice_enabled', e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <EyeIcon className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-900">Public Profile</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Allow others to see your profile and statistics
                    </p>
                  </div>
                  <AnimatedCheckbox
                    checked={settings.public_profile}
                    onChange={(e) => handleSettingsUpdate('public_profile', e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePasswordChange}
            >
              Update Password
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              type={showPassword.current ? 'text' : 'password'}
              value={passwordData.current_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
            >
              {showPassword.current ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New Password"
              type={showPassword.new ? 'text' : 'password'}
              value={passwordData.new_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
            >
              {showPassword.new ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showPassword.confirm ? 'text' : 'password'}
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
            >
              {showPassword.confirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
