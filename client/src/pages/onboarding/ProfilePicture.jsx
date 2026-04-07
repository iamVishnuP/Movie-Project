import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Camera, User, ArrowRight, Loader2, Sparkles, Upload, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageCropper from '../../components/ImageCropper';

const ProfilePicture = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [cropImageSrc, setCropImageSrc] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        e.target.value = ''; // Reset input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input so same file can be selected again
    }
  };

  const handleCropComplete = (croppedBase64) => {
    setImage(croppedBase64);
    setCropImageSrc(null);
  };

  const handleSubmit = async () => {
    if (!image) {
      return navigate('/onboarding/genres');
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/update-profile', { profileImage: image });
      setUser(response.data.user);
      toast.success('Profile picture saved!');
      navigate('/onboarding/genres');
    } catch (error) {
      toast.error('Failed to save profile picture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-text/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold-text/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-xl relative">
        <div className="flex flex-col items-center mb-8 md:mb-12 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gold-text flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
            <Camera className="w-6 h-6 md:w-8 md:h-8 text-black" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold gold-text">Add Profile Photo</h1>
          <p className="text-gray-400 mt-2 text-base md:text-lg px-4">Help your friends find you on Cinema Kottaka</p>
        </div>

        <div className="flex flex-col items-center mb-12">
          <div className="relative group">
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-dashed border-white/20 group-hover:border-gold-text/50 transition-all bg-white/5 flex items-center justify-center relative shadow-2xl">
              {image ? (
                <img src={image} alt="Profile preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <User className="w-20 h-20 mb-2 opacity-20" />
                  <span className="text-xs font-black uppercase tracking-widest">Select Photo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                title="Choose profile photo"
              />
            </div>
            {image && (
              <div className="absolute bottom-2 right-2 bg-gold-text text-black p-3 rounded-full shadow-2xl pointer-events-none animate-in zoom-in duration-300">
                <Plus className="w-5 h-5" />
              </div>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-6 uppercase tracking-[0.2em] font-bold">Max size 2MB · PNG, JPG</p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full gold-button py-4 rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {image ? 'Continue' : 'Skip For Now'} <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
};

export default ProfilePicture;
