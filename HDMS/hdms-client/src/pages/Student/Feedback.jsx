import { useEffect, useState } from 'react';
import {
  getEligibleFeedback,
  submitFeedbackFromToken
} from '../../api/feedbackApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const mealNames = {
  Breakfast: 'Breakfast',
  Lunch: 'Lunch',
  Dinner: 'Dinner'
};

function StudentFeedback() {
  const [eligibleTokens, setEligibleTokens] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await getEligibleFeedback();
      setEligibleTokens(data.tokens || data.Tokens || []);
      setMyFeedback(data.myFeedback || data.MyFeedback || []);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load feedback data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRatingChange = (id, value) => {
    setRatings((r) => ({ ...r, [id]: value }));
  };

  const handleCommentChange = (id, value) => {
    setComments((c) => ({ ...c, [id]: value }));
  };

  const handleSubmit = async (tokenId) => {
    const rating = parseInt(ratings[tokenId] ?? '0', 10);
    const comment = comments[tokenId] || '';

    if (!rating || rating < 1 || rating > 5) {
      setMsg('Rating must be between 1 and 5.');
      return;
    }

    try {
      await submitFeedbackFromToken({ tokenId, rating, comment });
      setMsg('Thanks for your feedback!');
      await load();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMsg(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Failed to submit feedback.'
        );
      } else {
        setMsg('Failed to submit feedback (network).');
      }
    }
  };

  if (loading) return <p>Loading feedback...</p>;

  return (
    <div>
      <h3>Meal Feedback</h3>
      {msg && <div className="alert alert-info">{msg}</div>}

      {eligibleTokens.length > 0 ? (
        <>
          <p>Select the meal token you used and rate it (1–5).</p>
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Slot</th>
                <th>Token</th>
                <th>Rating</th>
                <th>Comments</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {eligibleTokens.map((t) => {
                const dateStr = t.date || t.Date;
                const mealType = t.mealType || t.MealType;
                return (
                  <tr key={t.id}>
                    <td>{dateStr && dateStr.substring ? dateStr.substring(0, 10) : ''}</td>
                    <td>{mealNames[mealType] || mealType}</td>
                    <td>{t.id}</td>
                    <td style={{ maxWidth: 140 }}>
                      <select
                        className="form-select"
                        name="rating"
                        value={ratings[t.id] ?? '5'}
                        onChange={(e) => handleRatingChange(t.id, e.target.value)}
                        required
                      >
                        {[1, 2, 3, 4, 5].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-control"
                        name="comments"
                        placeholder="Optional comment"
                        value={comments[t.id] ?? ''}
                        onChange={(e) =>
                          handleCommentChange(t.id, e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Button
                        type="button"
                        className="btn-sm btn-prim"
                        onClick={() => handleSubmit(t.id)}
                      >
                        Submit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : (
        <div className="alert alert-info">
          No used meals pending feedback.
        </div>
      )}

      <h5 className="mt-4">My recent feedback</h5>
      <Card>
        <table className="table table-sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Slot</th>
            <th>Rating</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          {myFeedback.length === 0 && (
            <tr>
              <td colSpan="4" className="text-muted">
                No feedback yet.
              </td>
            </tr>
          )}
          {myFeedback.map((f) => {
            const dateStr = f.date || f.Date;
            const mealType = f.mealType || f.MealType;
            return (
              <tr key={f.id}>
                <td>
                  {dateStr && dateStr.substring ? dateStr.substring(0, 10) : ''}
                </td>
                <td>{mealNames[mealType] || mealType}</td>
                <td>{f.rating ?? f.Rating}</td>
                <td>{f.comment ?? f.Comment ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
    </div>
  );
}

export default StudentFeedback;