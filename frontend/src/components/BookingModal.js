import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const BookingModal = ({ mentor, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { addBooking } = useData();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBook = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }
    if (!user) {
      setError('You must be logged in to book a session');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addBooking(mentor.id, selectedSlot.id);
      if (onSuccess) onSuccess(mentor.name);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Book a session with {mentor.name}</h3>
        <p>Select an available time slot:</p>
        <div className="slots-list">
          {mentor.availableSlots?.length === 0 ? (
            <p>No slots available at the moment.</p>
          ) : (
            mentor.availableSlots.map((slotObj, idx) => (
              <button
                key={idx}
                className={selectedSlot?.id === slotObj.id ? 'btn-primary' : 'btn-outline'}
                onClick={() => setSelectedSlot(slotObj)}
                style={{ margin: '0.5rem' }}
              >
                {new Date(slotObj.slot).toLocaleString()}
              </button>
            ))
          )}
        </div>
        {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
        <div className="modal-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleBook} disabled={!selectedSlot || loading}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;