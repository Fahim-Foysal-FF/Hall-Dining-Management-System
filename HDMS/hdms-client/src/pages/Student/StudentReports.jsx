import { useEffect, useState } from 'react';
import { getMyMonthlyTokens } from '../../api/reportsApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

function StudentReports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthInput, setMonthInput] = useState(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`; // yyyy-MM for native month picker
  });
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const data = await getMyMonthlyTokens(year, month);
      if (!data) {
        setReport(null);
        return;
      }
      // Normalize casing from backend
      setReport({
        year: data.year ?? data.Year,
        month: data.month ?? data.Month,
        purchasedTokens:
          data.purchasedTokens ?? data.PurchasedTokens ?? 0,
        remainingTokens:
          data.remainingTokens ?? data.RemainingTokens ?? 0
      });
    } catch (e) {
      console.error(e);
      setError('Failed to load report.');
    }
  };

  // Load whenever the selected month (year/month pair) changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const handleMonthChange = (value) => {
    setMonthInput(value);
    if (!value) return;
    const [y, m] = value.split('-');
    const parsedYear = parseInt(y, 10);
    const parsedMonth = parseInt(m, 10);
    if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonth)) return;
    setYear(parsedYear);
    setMonth(parsedMonth);
  };

  return (
    <div>
      <h2>My Monthly Token Report</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3 d-flex align-items-end gap-2 flex-wrap">
        <div>
          <label className="form-label mb-1">Month</label>
          <input
            type="month"
            className="form-control"
            value={monthInput}
            onChange={(e) => handleMonthChange(e.target.value)}
          />
        </div>
        <Button onClick={load} className="mb-1">Load Report</Button>
      </div>
      {report && (
        <Card>
          <h4>Report for {report.year}-{String(report.month).padStart(2, '0')}</h4>
          <p><strong>Tokens Purchased:</strong> {report.purchasedTokens}</p>
          <p><strong>Remaining Tokens:</strong> {report.remainingTokens}</p>
          <div className="alert alert-info">
            Monthly limit: 45 tokens. You have {report.remainingTokens} tokens left to purchase this month.
          </div>
        </Card>
      )}
    </div>
  );
}

export default StudentReports;