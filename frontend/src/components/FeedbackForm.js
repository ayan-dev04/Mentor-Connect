import React, { useState } from 'react';

const FeedbackForm = ({ onSubmit, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(rating, comment);
  };

  return (
    <div className="modal-overlay">
      <form className="modal-content" onSubmit={handleSubmit}>
        <h3>Give Feedback</h3>
        <div className="form-group">
          <label>Rating</label>
          <div className="rating-stars" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map(r => (
              <i
                key={r}
                className={r <= rating ? 'fas fa-star' : 'far fa-star'}
                style={{ fontSize: '24px', color: '#c9a84c', cursor: 'pointer' }}
                onClick={() => setRating(r)}
              />
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Comment (optional)</label>
          <textarea
            className="form-input"
            rows="3"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience..."
          />
        </div>
        <div className="modal-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;