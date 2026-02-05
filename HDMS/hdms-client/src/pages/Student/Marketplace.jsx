import { useEffect, useState } from 'react';
import { getListings, buyListing } from '../../api/marketplaceApi';
import Button from '../../components/ui/Button';

function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const data = await getListings();
      setListings(data);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBuy = async (id) => {
    setMsg('');
    try {
      await buyListing(id);
      setMsg('Token purchased and transferred.');
      await load();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMsg(
          typeof err.response.data === 'string'
            ? err.response.data
            : 'Purchase failed.'
        );
      } else {
        setMsg('Purchase failed (network).');
      }
    }
  };

  if (loading) return <p>Loading marketplace...</p>;

  return (
    <div>
      <h3>Marketplace</h3>
      {msg && <div className="alert alert-info">{msg}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Date</th>
            <th>Slot</th>
            <th>Seller</th>
            <th>Price</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {listings.length === 0 && (
            <tr>
              <td colSpan="6" className="text-muted">
                No active listings
              </td>
            </tr>
          )}
          {listings.map((l) => {
            const date = l.date ?? l.Date;
            const mealType = l.mealType ?? l.MealType;
            const sellerName = l.sellerName ?? l.SellerName;
            const price = Number(l.listingPrice ?? l.ListingPrice ?? 0);
            return (
              <tr key={l.id}>
                <td>{l.tokenId}</td>
                <td>{date && date.substring ? date.substring(0, 10) : ''}</td>
                <td>{mealType}</td>
                <td>{sellerName}</td>
                <td>৳ {price.toFixed(2)}</td>
                <td>
                  <Button type="button" className="btn-sm" onClick={() => handleBuy(l.id)}>
                    Buy
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Marketplace;