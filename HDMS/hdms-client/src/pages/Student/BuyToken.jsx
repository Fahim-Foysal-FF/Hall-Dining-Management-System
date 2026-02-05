import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBuyOptions, buyToken, buyQRTokenGroup } from '../../api/ordersApi';
import { checkDiningAvailable } from '../../api/diningClosureApi';
import Button from '../../components/ui/Button';

const slotNames = {
  LUNCH: 'Lunch',
  DINNER: 'Dinner'
};

function BuyToken() {
  const [lunchPreference, setLunchPreference] = useState('');
  const [dinnerPreference, setDinnerPreference] = useState('');
  const [lunchBuyType, setLunchBuyType] = useState('single'); // 'single' or 'bundle'
  const [dinnerBuyType, setDinnerBuyType] = useState('single'); // 'single' or 'bundle'
  const [lunchQuantity, setLunchQuantity] = useState(2);
  const [dinnerQuantity, setDinnerQuantity] = useState(2);
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [diningClosed, setDiningClosed] = useState(false);
  const [lunchBuying, setLunchBuying] = useState(false);
  const [dinnerBuying, setDinnerBuying] = useState(false);

  const dateParam = searchParams.get('date');
  const slotParam = (searchParams.get('slot') || 'LUNCH').toUpperCase();

  // Load options
  const load = async () => {
    setLoading(true);
    const resolvedDate = getResolvedDate(dateParam);

    try {
      // Check if dining is available for this date
      const availability = await checkDiningAvailable(resolvedDate);
      const available = availability?.available ?? true;
      setDiningClosed(!available);
      
      const resp = await getBuyOptions(resolvedDate);
      setData(normalizeData(resp, resolvedDate));
    } catch (err) {
      console.error(err);
      setMsg('Failed to load options.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [dateParam]);

  const handleBuy = async (slot) => {
    if (!data) return;
    
    // Check if dining is closed for this date
    if (diningClosed) {
      setMsg('❌ Dining is temporarily closed on this date. Token purchase is not available.');
      return;
    }
    
    // Get preference based on slot
    const preference = slot === 'LUNCH' ? lunchPreference : dinnerPreference;
    const mealData = slot === 'LUNCH' ? data.lunch : data.dinner;
    
    // Check if choices are available and preference is required
    if (mealData && mealData.choices && mealData.choices.length > 0 && !preference) {
      setMsg('Please select a preference before purchasing.');
      return;
    }
    
    // Set loading state for specific slot
    if (slot === 'LUNCH') setLunchBuying(true);
    if (slot === 'DINNER') setDinnerBuying(true);
    
    setMsg('');
    try {
      const result = await buyToken({
        date: data.date,
        slot: slot,
        preference: preference || undefined
      });
      setMsg(`✅ ${slotNames[slot]} token purchased successfully!`);
      
      // Reset preferences
      if (slot === 'LUNCH') setLunchPreference('');
      if (slot === 'DINNER') setDinnerPreference('');
      
      // Reload data
      load();
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        setMsg(typeof err.response.data === 'string' 
          ? err.response.data 
          : 'Purchase failed.');
      } else {
        setMsg('Purchase failed (network).');
      }
    } finally {
      // Clear loading state
      if (slot === 'LUNCH') setLunchBuying(false);
      if (slot === 'DINNER') setDinnerBuying(false);
    }
  };

  const handleBuyQR = async (slot) => {
    if (!data) return;
    
    // Check if dining is closed for this date
    if (diningClosed) {
      setMsg('❌ Dining is temporarily closed on this date. Token purchase is not available.');
      return;
    }
    
    // Get preference based on slot
    const preference = slot === 'LUNCH' ? lunchPreference : dinnerPreference;
    const quantity = slot === 'LUNCH' ? lunchQuantity : dinnerQuantity;
    const mealData = slot === 'LUNCH' ? data.lunch : data.dinner;
    
    // Check if choices are available and preference is required
    if (mealData && mealData.choices && mealData.choices.length > 0 && !preference) {
      setMsg('Please select a preference before purchasing.');
      return;
    }
    
    // Set loading state for specific slot
    if (slot === 'LUNCH') setLunchBuying(true);
    if (slot === 'DINNER') setDinnerBuying(true);
    
    setMsg('');
    try {
      const result = await buyQRTokenGroup({
        date: data.date,
        slot: slot,
        quantity: quantity,
        preference: preference || undefined
      });
      setMsg(`✅ Successfully purchased ${quantity} ${slotNames[slot]} token(s) in one QR code!`);
      
      // Reset preferences and quantities
      if (slot === 'LUNCH') {
        setLunchPreference('');
        setLunchQuantity(2);
      }
      if (slot === 'DINNER') {
        setDinnerPreference('');
        setDinnerQuantity(2);
      }
      
      // Reload data
      load();
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        setMsg(typeof err.response.data === 'string' 
          ? err.response.data 
          : 'Purchase failed.');
      } else {
        setMsg('Purchase failed (network).');
      }
    } finally {
      // Clear loading state
      if (slot === 'LUNCH') setLunchBuying(false);
      if (slot === 'DINNER') setDinnerBuying(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No data.</p>;

  const { date, limit, lunch, dinner, lunchCount, dinnerCount } = data;
  const lunchDisabled = lunchCount >= limit;
  const dinnerDisabled = dinnerCount >= limit;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Buy Meal Token</h3>
      
      {diningClosed && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <strong>Dining Closed:</strong> Token purchases are not available for this date due to dining closure.
        </div>
      )}
      
      {msg && (
        <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
          {msg}
        </div>
      )}
      
      <div className="row g-4">
        {/* Lunch card */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Lunch - {date}</h5>
              <div className="mb-3">
                <label className="form-label">Lunch Preference (optional)</label>
                <select
                  className="form-select"
                  value={lunchPreference}
                  onChange={e => setLunchPreference(e.target.value)}
                >
                  <option value="">-- Select preference --</option>
                  {lunch && lunch.choices && lunch.choices.length > 0 && lunch.choices.map((choice, idx) => (
                    <option key={idx} value={choice}>{choice}</option>
                  ))}
                </select>
                <small className="text-muted">You can specify your lunch preference for this token.</small>
              </div>
              {lunch ? (
                <>
                  <p className="mb-1">{lunch.itemsText}</p>
                  {lunch.note && (
                    <p className="text-muted small mb-2">{lunch.note}</p>
                  )}
                  <p className="fw-semibold">
                    Price: ৳ {lunch.price.toFixed(2)} per token
                  </p>
                  <p className="mb-4 text-muted">
                    You own {lunchCount}/{limit} lunch token(s) for {date}.
                  </p>

                  {/* Purchase Type Dropdown */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">How to Buy?</label>
                    <select
                      className="form-select"
                      value={lunchBuyType}
                      onChange={e => setLunchBuyType(e.target.value)}
                      disabled={lunchDisabled}
                    >
                      <option value="single">Single Token (scan once, get 1 token)</option>
                      <option value="bundle">QR Code Bundle (1 QR code with 2-4 tokens)</option>
                    </select>
                  </div>

                  {lunchDisabled && (
                    <div className="alert alert-danger small mb-3">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      You reached the daily limit for lunch tokens.
                    </div>
                  )}

                  {/* Single Token Purchase */}
                  {lunchBuyType === 'single' && (
                    <Button
                      type="button"
                      className="w-100"
                      onClick={() => handleBuy('LUNCH')}
                      disabled={lunchDisabled}
                    >
                      Buy 1 Token (৳ {lunch.price.toFixed(2)})
                    </Button>
                  )}

                  {/* QR Code Bundle Purchase */}
                  {lunchBuyType === 'bundle' && (
                    <div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Quantity in Bundle (2-4 tokens)</label>
                        <select
                          className="form-select"
                          value={lunchQuantity}
                          onChange={e => setLunchQuantity(parseInt(e.target.value))}
                          disabled={lunchDisabled}
                        >
                          <option value="2">2 Tokens</option>
                          <option value="3">3 Tokens</option>
                          <option value="4">4 Tokens</option>
                        </select>
                        <small className="text-muted d-block mt-2">
                          Total: ৳ {(lunch.price * lunchQuantity).toFixed(2)}
                        </small>
                      </div>
                      <Button
                        type="button"
                        className="w-100 btn-success"
                        onClick={() => handleBuyQR('LUNCH')}
                        disabled={lunchDisabled || lunchBuying}
                      >
                        {lunchBuying ? 'Processing...' : `Buy ${lunchQuantity} Tokens in One QR Code`}
                      </Button>
                      <small className="d-block mt-2 text-info">
                        <i className="bi bi-info-circle me-1"></i>
                        Each QR scan decreases 1 token. Scan {lunchQuantity} times to use all tokens.
                      </small>
                    </div>
                  )}
                </>
              ) : (
                <div className="alert alert-warning">
                  No lunch plan for this date.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dinner card */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Dinner - {date}</h5>
              <div className="mb-3">
                <label className="form-label">Dinner Preference (optional)</label>
                <select
                  className="form-select"
                  value={dinnerPreference}
                  onChange={e => setDinnerPreference(e.target.value)}
                >
                  <option value="">-- Select preference --</option>
                  {dinner && dinner.choices && dinner.choices.length > 0 && dinner.choices.map((choice, idx) => (
                    <option key={idx} value={choice}>{choice}</option>
                  ))}
                </select>
                <small className="text-muted">You can specify your dinner preference for this token.</small>
              </div>
              {dinner ? (
                <>
                  <p className="mb-1">{dinner.itemsText}</p>
                  {dinner.note && (
                    <p className="text-muted small mb-2">{dinner.note}</p>
                  )}
                  <p className="fw-semibold">
                    Price: ৳ {dinner.price.toFixed(2)} per token
                  </p>
                  <p className="mb-4 text-muted">
                    You own {dinnerCount}/{limit} dinner token(s) for {date}.
                  </p>

                  {/* Purchase Type Dropdown */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">How to Buy?</label>
                    <select
                      className="form-select"
                      value={dinnerBuyType}
                      onChange={e => setDinnerBuyType(e.target.value)}
                      disabled={dinnerDisabled}
                    >
                      <option value="single">Single Token (scan once, get 1 token)</option>
                      <option value="bundle">QR Code Bundle (1 QR code with 2-4 tokens)</option>
                    </select>
                  </div>

                  {dinnerDisabled && (
                    <div className="alert alert-danger small mb-3">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      You reached the daily limit for dinner tokens.
                    </div>
                  )}

                  {/* Single Token Purchase */}
                  {dinnerBuyType === 'single' && (
                    <Button
                      type="button"
                      className="w-100"
                      onClick={() => handleBuy('DINNER')}
                      disabled={dinnerDisabled}
                    >
                      Buy 1 Token (৳ {dinner.price.toFixed(2)})
                    </Button>
                  )}

                  {/* QR Code Bundle Purchase */}
                  {dinnerBuyType === 'bundle' && (
                    <div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Quantity in Bundle (2-4 tokens)</label>
                        <select
                          className="form-select"
                          value={dinnerQuantity}
                          onChange={e => setDinnerQuantity(parseInt(e.target.value))}
                          disabled={dinnerDisabled}
                        >
                          <option value="2">2 Tokens</option>
                          <option value="3">3 Tokens</option>
                          <option value="4">4 Tokens</option>
                        </select>
                        <small className="text-muted d-block mt-2">
                          Total: ৳ {(dinner.price * dinnerQuantity).toFixed(2)}
                        </small>
                      </div>
                      <Button
                        type="button"
                        className="w-100 btn-success"
                        onClick={() => handleBuyQR('DINNER')}
                        disabled={dinnerDisabled || dinnerBuying}
                      >
                        {dinnerBuying ? 'Processing...' : `Buy ${dinnerQuantity} Tokens in One QR Code`}
                      </Button>
                      <small className="d-block mt-2 text-info">
                        <i className="bi bi-info-circle me-1"></i>
                        Each QR scan decreases 1 token. Scan {dinnerQuantity} times to use all tokens.
                      </small>
                    </div>
                  )}
                </>
              ) : (
                <div className="alert alert-warning">
                  No dinner plan for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getResolvedDate(input) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsed = input ? new Date(input) : null;
  const isValid = parsed && !isNaN(parsed.getTime());
  let target = isValid ? parsed : new Date(today);

  if (!isValid || target <= today) {
    target = new Date(today);
    target.setDate(today.getDate() + 1); // default to tomorrow, matching backend behavior
  }

  return target.toISOString().substring(0, 10);
}

function normalizeData(d, fallbackDate) {
  // ensure property names in lowerCamelCase from anonymous .NET object
  return {
    date: d.date || d.Date || fallbackDate,
    limit: d.limit ?? d.Limit,
    lunch: d.lunch || d.Lunch,
    dinner: d.dinner || d.Dinner,
    lunchCount: d.lunchCount ?? d.LunchCount ?? 0,
    dinnerCount: d.dinnerCount ?? d.DinnerCount ?? 0
  };
}

export default BuyToken;      