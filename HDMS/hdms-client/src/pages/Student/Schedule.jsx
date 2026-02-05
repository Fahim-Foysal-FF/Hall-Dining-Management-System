import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWeekPlan } from '../../api/planApi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

function Schedule() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getWeekPlan();
        setDays(data);
      } catch (err) {
        console.error(err);
        setMsg('Failed to load schedule.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleBuy = (date, slot) => {
    navigate(`/student/buy-token?date=${date}&slot=${slot}`);
  };

  if (loading) return <p>Loading schedule...</p>;
  if (msg) return <div className="alert alert-danger">{msg}</div>;

  return (
    <div>
      <h3 className="mb-3">Weekly Dining Plan</h3>
      <p className="text-muted">
        Rice &amp; Lentils are common items. Menu may change due to unavoidable situations.
      </p>

      <div className="row g-3">
        {days.map((day, idx) => {
          // Normalize property names from backend (camelCase) to local vars
          const dow = day.dow || day.Dow;
          const lunch = day.lunch || day.Lunch;
          const dinner = day.dinner || day.Dinner;
          const nextDateLunch = day.nextDateLunch || day.NextDateLunch;
          const nextDateDinner = day.nextDateDinner || day.NextDateDinner;

          return (
            <div className="col-md-6" key={idx}>
              <Card>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-2">{dow}</h5>
                </div>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="fw-semibold">Lunch</div>
                    {lunch ? (
                      <>
                        <div>{lunch.itemsText}</div>
                        {lunch.note && (
                          <div className="text-muted small">{lunch.note}</div>
                        )}
                        <div className="small text-muted">
                          ৳ {Number(lunch.price).toFixed(2)}
                        </div>
                        <Button
                          type="button"
                          className="btn-sm mt-2"
                          onClick={() => handleBuy(nextDateLunch, 'LUNCH')}
                        >
                          Buy Lunch
                        </Button>
                      </>
                    ) : (
                      <div className="text-muted small">No lunch plan.</div>
                    )}
                  </div>
                  <div className="col-sm-6">
                    <div className="fw-semibold">Dinner</div>
                    {dinner ? (
                      <>
                        <div>{dinner.itemsText}</div>
                        {dinner.note && (
                          <div className="text-muted small">{dinner.note}</div>
                        )}
                        <div className="small text-muted">
                          ৳ {Number(dinner.price).toFixed(2)}
                        </div>
                        <Button
                          type="button"
                          className="btn-sm mt-2"
                          onClick={() => handleBuy(nextDateDinner, 'DINNER')}
                        >
                          Buy Dinner
                        </Button>
                      </>
                    ) : (
                      <div className="text-muted small">No dinner plan.</div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Schedule;