import { Fragment, useEffect, useState } from 'react';
import { getMealPlans, updateMealPlan } from '../../api/mealPlansApi';

const slotLabel = {
  LUNCH: 'Lunch',
  DINNER: 'Dinner'
};

const dayDisplay = {
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday'
};

function ManageMenu() {
  const [plans, setPlans] = useState([]);
  const [edited, setEdited] = useState({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await getMealPlans();
      setPlans(data);
      const e = {};
      data.forEach((p) => {
        e[p.id] = {
          itemsText: p.itemsText,
          choicesText: p.choicesText || '',
          price: p.price,
          note: p.note || ''
        };
      });
      setEdited(e);
    } catch (err) {
      console.error('Failed to load meal plans:', err);
      setMsg('Failed to load meal plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (id, field, value) => {
    setEdited((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSave = async (id) => {
    const p = edited[id];
    if (!p) return;
    setMsg('');
    try {
      await updateMealPlan(id, {
        itemsText: p.itemsText,
        choicesText: p.choicesText,
        price: parseFloat(p.price),
        note: p.note
      });
      setMsg('Updated meal plan.');
      await load();
    } catch (err) {
      console.error('Failed to update meal plan:', err);
      if (err.response && err.response.data) {
        setMsg(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Failed to update meal plan.'
        );
      } else {
        setMsg('Failed to update meal plan (network).');
      }
    }
  };

  if (loading) return <p>Loading meal plan...</p>;

  // group by day-of-week
  const grouped = {};
  plans.forEach((p) => {
    const dow = p.dayOfWeek || p.DayOfWeek;
    if (!grouped[dow]) grouped[dow] = [];
    grouped[dow].push(p);
  });

  const order = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <div>
          <h3 className="mb-1">Weekly Meal Plan</h3>
          <p className="text-muted mb-0">
            Edit the items, choices (e.g., CHICKEN|FISH), price, and notes for each day/slot.
          </p>
          <p className="text-muted small mb-0">Rice &amp; Lentils are common items.</p>
        </div>
        {msg && <div className="alert alert-info py-2 px-3 mb-0">{msg}</div>}
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '12%' }}>Day</th>
                  <th style={{ width: '10%' }}>Slot</th>
                  <th style={{ width: '24%' }}>Items</th>
                  <th style={{ width: '20%' }}>Choices</th>
                  <th style={{ width: '11%' }}>Price</th>
                  <th style={{ width: '18%' }}>Note</th>
                  <th style={{ width: '6%' }}></th>
                </tr>
              </thead>
              <tbody>
                {order.map((dow) => (
                  <Fragment key={dow}>
                    <tr className="table-light">
                      <td colSpan="7" className="text-uppercase small fw-semibold text-secondary">
                        {dayDisplay[dow] || dow}
                      </td>
                    </tr>
                    {(grouped[dow] || []).map((p) => {
                      const id = p.id;
                      const e = edited[id] || {
                        itemsText: p.itemsText,
                        choicesText: p.choicesText || '',
                        price: p.price,
                        note: p.note || ''
                      };
                      const slot = p.timeSlot || p.TimeSlot;
                      return (
                        <tr key={id}>
                          <td className="text-nowrap">{dayDisplay[dow] || dow}</td>
                          <td className="text-nowrap fw-semibold text-secondary">
                            {slotLabel[slot] || slot}
                          </td>
                          <td>
                            <input
                              className="form-control"
                              value={e.itemsText}
                              onChange={(ev) => handleChange(id, 'itemsText', ev.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control"
                              placeholder="e.g., CHICKEN|FISH"
                              value={e.choicesText}
                              onChange={(ev) => handleChange(id, 'choicesText', ev.target.value)}
                            />
                          </td>
                          <td style={{ maxWidth: 150 }}>
                            <div className="input-group" style={{ minWidth: 140 }}>
                              <span className="input-group-text">৳</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                className="form-control"
                                value={e.price}
                                onChange={(ev) => handleChange(id, 'price', ev.target.value)}
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              className="form-control"
                              placeholder="Notes (optional)"
                              value={e.note}
                              onChange={(ev) => handleChange(id, 'note', ev.target.value)}
                            />
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-primary btn-sm px-3"
                              onClick={() => handleSave(id)}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageMenu;