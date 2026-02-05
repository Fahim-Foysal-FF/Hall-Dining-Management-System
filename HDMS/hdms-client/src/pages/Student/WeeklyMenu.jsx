import { useEffect, useState } from 'react';
import { getCurrentWeekMenu } from '../../api/menuApi';
import { purchaseTokens } from '../../api/tokensApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const mealNames = ['Breakfast', 'Lunch', 'Dinner'];

function WeeklyMenu() {
  const [menu, setMenu] = useState(null);
  const [selected, setSelected] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getCurrentWeekMenu();
        setMenu(data);
      } catch (err) {
        console.error(err);
        setMenu(null);
      }
    })();
  }, []);

  const toggleSelection = (date, mealType) => {
    const key = `${date}-${mealType}`;
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePurchase = async () => {
    const selections = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => {
        const [d, mt] = k.split('-');
        return { date: d, mealType: parseInt(mt, 10) };
      });
    if (!selections.length) {
      setMsg('Select at least one meal.');
      return;
    }
    try {
      const res = await purchaseTokens({ selections, paymentMethod: 'Mock' });
      setMsg(`Purchased ${res.data?.TokenCount ?? res.TokenCount} tokens.`);
    } catch (err) {
      console.error(err);
      setMsg('Purchase failed.');
    }
  };

  if (!menu) return <p>No current menu.</p>;

  return (
    <div>
      <h2>Weekly Menu</h2>
      <p>
        {menu.weekStartDate.substring(0, 10)} -{' '}
        {menu.weekEndDate.substring(0, 10)}
      </p>
      {menu.meals.map((m) => {
        const d = m.date.substring(0, 10);
        const key = `${d}-${m.mealType}`;
        return (
          <Card key={key} className="mb-3">
            <label className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={!!selected[key]}
                onChange={() => toggleSelection(d, m.mealType)}
              />
              <strong>{d} - {mealNames[m.mealType]}</strong>
            </label>
            <ul className="mt-2">
              {m.items.map((it) => (
                <li key={it.foodItemId}>
                  {it.foodItemName} (৳ {it.price})
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
      <div className="d-flex gap-2">
        <Button onClick={handlePurchase}>Purchase Selected</Button>
        {msg && <div className="muted">{msg}</div>}
      </div>
    </div>
  );
}

export default WeeklyMenu;