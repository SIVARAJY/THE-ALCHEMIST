import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '../api';

const StarRating = ({ rating, setRating, label }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`transition-colors ${star <= rating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
          >
            <Star className="w-8 h-8 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );
};

const FeedbackModal = ({ role, reservationId, userId, onClose, onSuccess }) => {
  const [ratingRoom, setRatingRoom] = useState(0);
  const [ratingResources, setRatingResources] = useState(0);
  const [ratingSpecific, setRatingSpecific] = useState(0); // Meeting Quality (Attendee) OR Overall Exp (Organizer)
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (ratingRoom === 0 || ratingResources === 0 || ratingSpecific === 0) {
      setError('Please provide a rating for all categories.');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        reservation_id: reservationId,
        user_id: userId,
        role: role,
        rating_room: ratingRoom,
        rating_resources: ratingResources,
        comments: comments
      };

      if (role === 'Attendee') {
        payload.rating_meeting = ratingSpecific;
      } else {
        payload.rating_overall = ratingSpecific;
      }

      await api.post('/feedback', payload);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">Leave Feedback</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <StarRating rating={ratingRoom} setRating={setRatingRoom} label="Room Condition" />
          <StarRating rating={ratingResources} setRating={setRatingResources} label="Provided Resources" />
          
          {role === 'Attendee' ? (
             <StarRating rating={ratingSpecific} setRating={setRatingSpecific} label="Meeting Quality" />
          ) : (
             <StarRating rating={ratingSpecific} setRating={setRatingSpecific} label="Overall Experience" />
          )}

          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Comments (Optional)</label>
            <textarea 
              rows="3" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              placeholder="Tell us what you liked or what could be improved..."
              value={comments}
              onChange={e => setComments(e.target.value)}
            ></textarea>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
