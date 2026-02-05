import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axiosClient from '../../api/axiosClient';
import { getTokenDetails } from '../../api/tokensApi';
import { checkESP32Status, getESP32BaseUrlInfo, setESP32BaseUrl, triggerServoGate } from '../../config/espConfig';

function AdminScan() {
  const [scannedData, setScannedData] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false); // QR processing
  const [manualLoading, setManualLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [cameraId, setCameraId] = useState('');
  const [zoom, setZoom] = useState(1);
  const [scanPaused, setScanPaused] = useState(false);
  const [tokenId, setTokenId] = useState('');
  const [espUrlInput, setEspUrlInput] = useState('');
  const [espUrlSource, setEspUrlSource] = useState('env');
  const [espMsg, setEspMsg] = useState('');
  const [espTestLoading, setEspTestLoading] = useState(false);
  const [espOnline, setEspOnline] = useState(null);
  const [espUnlockLoading, setEspUnlockLoading] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const cams = await Html5Qrcode.getCameras();
        if (!isMounted) return;
        const list = cams?.map((c) => ({ id: c.id, label: c.label })) || [];
        setCameras(list);

        // Prefer back camera if available
        const back = list.find((c) => (c.label || '').toLowerCase().includes('back')) || list[0];
        const chosenId = back?.id || list[0]?.id || '';
        setCameraId(chosenId);

        await initQrScanner(chosenId);
      } catch (e) {
        console.error('Camera init error:', e);
        setMsg('Unable to access camera. Please allow camera permissions.');
      }
    }

    init();

    const espInfo = getESP32BaseUrlInfo();
    setEspUrlInput(espInfo.baseUrl);
    setEspUrlSource(espInfo.source);

    return () => {
      isMounted = false;
      stopScanner();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  // Unified method for QR generation and scanning
  const initQrScanner = async (deviceId) => {
    try {
      stopScanner();
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');

      const config = {
        fps: 30, // Fast scanning - 30 frames per second
        qrbox: { width: 300, height: 300 }
      };

      const constraints = deviceId || { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        constraints,
        config,
        async (decodedText) => {
          // On QR detection, immediately process the token
          await processTokenFromQR(decodedText);
        },
        (errorMessage) => {
          // Suppress error spam
        }
      );
      setZoom(1);
      setMsg('');
    } catch (e) {
      console.error('QR Scanner init error:', e);
      setMsg('Failed to start scanner. Please reload and check camera permissions.');
    }
  };

  // Process token from scanned QR code
  const processTokenFromQR = async (tokenIdStr) => {
    // Prevent processing if scan is paused OR already loading
    if (scanPaused || loading) {
      console.log('Scan blocked - paused:', scanPaused, 'loading:', loading);
      return;
    }

    // IMMEDIATELY pause scanning to prevent duplicate scans
    setScanPaused(true);
    setLoading(true);

    // Stop the scanner after a successful detection; we'll restart after delay
    stopScanner();

    console.log('========== QR SCAN DEBUG ==========');
    console.log('Raw scanned data:', tokenIdStr);
    console.log('Raw data length:', tokenIdStr.length);
    console.log('Raw data type:', typeof tokenIdStr);

    let payload = {};
    
    // Trim whitespace and convert to uppercase for GUID matching
    const trimmed = tokenIdStr.trim().toUpperCase();
    console.log('Trimmed & uppercase:', trimmed);
    
    // Check for GUID pattern FIRST (before parseInt which interprets 0b as binary)
    const cleanGuid = trimmed.replace(/-/g, '');
    const isValidHex32 = /^[0-9A-F]{32}$/.test(cleanGuid);
    const isValidGuidFormat = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(trimmed);
    
    if (isValidHex32 || isValidGuidFormat) {
      // It's a GUID - could be TokenUid or QRGroupCode
      const formatted = isValidHex32
        ? `${cleanGuid.substring(0, 8)}-${cleanGuid.substring(8, 12)}-${cleanGuid.substring(12, 16)}-${cleanGuid.substring(16, 20)}-${cleanGuid.substring(20, 32)}`
        : trimmed;
      console.log('✓ Detected as GUID:', formatted);
      
      // Try QRGroupCode first (more likely to be a group scan)
      console.log('Attempting to match as QRGroupCode (QR Token Bundle)...');
      payload.QRGroupCode = formatted;
    } else {
      // Try parsing as integer
      const tokenId = parseInt(trimmed, 10);
      console.log('Parsed as integer:', tokenId, 'isNaN:', isNaN(tokenId));
      
      if (!isNaN(tokenId) && tokenId > 0) {
        console.log('✓ Detected as TokenId (integer)');
        payload.TokenId = tokenId;
      } else {
        console.error('❌ Invalid format - not integer or GUID');
        setMsg('Invalid QR code format. Expected TokenId (number) or QR code (GUID).');
        return;
      }
    }

    console.log('Final payload:', JSON.stringify(payload, null, 2));
    console.log('===================================');

    setScannedData(trimmed);
    setMsg('Processing...');

    try {
      console.log('Sending redeem request to backend...');
      const res = await axiosClient.post('/tokens/redeem', payload);
      console.log('✓ Backend responded successfully:', res.data);
      
      // Check if this is a NEW redemption (not already redeemed)
      const tokenData = res.data?.token || res.data?.Token;
      const wasJustRedeemed = tokenData?.status === 'Redeemed' || tokenData?.Status === 'Redeemed';
      
      setMsg('✅ Token redeemed successfully!');
      setDetails(res.data);
      
      // ONLY trigger servo gate for NEW redemptions (not already redeemed tokens)
      if (wasJustRedeemed) {
        console.log('[UI] NEW redemption confirmed - triggering servo gate');
        try {
          const gateOpened = await triggerServoGate();
          if (gateOpened) {
            console.log('[UI] ✓ Servo gate opened for meal access');
          } else {
            console.warn('[UI] ⚠ Servo gate trigger failed - please check ESP32 connection');
          }
        } catch (hardwareErr) {
          console.error('[UI] ❌ Hardware trigger error:', hardwareErr);
          // Continue anyway - token was still redeemed successfully
        }
      } else {
        console.log('[UI] Token status is not "Redeemed" - skipping servo trigger');
      }

      // Wait 5 seconds before allowing next scan
      console.log('Waiting 5 seconds before resuming scanner...');
      setTimeout(() => {
        console.log('Resuming scanner after 5 seconds');
        setScanPaused(false);
        setLoading(false);
        setMsg(''); // Clear message for next scan
        setDetails(null); // Clear details for next scan
        // Restart scanner if the QR reader element still exists
        if (document.getElementById('qr-reader')) {
          initQrScanner(cameraId);
        }
      }, 5000);
    } catch (err) {
      console.error('ERROR during token redemption:', err);
      let errorMsg = 'Failed to redeem token.';
      
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string' ? err.response.data : 'Failed to redeem token.';
      } else {
        errorMsg = 'Network error. Please try again.';
      }

      // DO NOT trigger servo on error (already redeemed, cancelled, etc.)
      console.log('[UI] ❌ Error occurred - servo NOT triggered:', errorMsg);
      
      setMsg(`❌ ${errorMsg}`);

      // Resume scanning after 5 seconds on error (same as success)
      setTimeout(() => {
        setScanPaused(false);
        setLoading(false);
        setMsg(''); // Clear error message
        setDetails(null); // Clear details too
        // Restart scanner if the QR reader element still exists
        if (document.getElementById('qr-reader')) {
          initQrScanner(cameraId);
        }
      }, 5000);

      // Try to fetch and display token details for any error
      let shouldFetchDetails = false;
      
      // Fetch details if token has an issue (not just redemption failures)
      if (errorMsg.includes('already') || errorMsg.includes('not available') || 
          errorMsg.includes('Cancelled') || errorMsg.includes('Sold') || 
          errorMsg.includes('listed') || errorMsg.includes('found')) {
        shouldFetchDetails = true;
      }

      if (shouldFetchDetails) {
        try {
          let tokenDetails = null;
          const tokenIdNum = parseInt(trimmed);
          
          console.log('Attempting to fetch token details. TokenIdNum:', tokenIdNum, 'Trimmed:', trimmed);
          
          if (!isNaN(tokenIdNum)) {
            tokenDetails = await getTokenDetails(tokenIdNum, null);
          } else {
            // Try as GUID
            const cleanGuid = trimmed.replace(/-/g, '');
            if (/^[0-9A-F]{32}$/.test(cleanGuid)) {
              const formatted = `${cleanGuid.substring(0, 8)}-${cleanGuid.substring(8, 12)}-${cleanGuid.substring(12, 16)}-${cleanGuid.substring(16, 20)}-${cleanGuid.substring(20, 32)}`;
              console.log('Formatted GUID:', formatted);
              tokenDetails = await getTokenDetails(null, formatted);
            }
          }
          
          console.log('Token details fetched:', tokenDetails);
          
          if (tokenDetails) {
            setMsg(`ℹ️ ${errorMsg}`);
            setDetails(tokenDetails);
          }
        } catch (detailErr) {
          console.error('Failed to fetch token details:', detailErr);
        }
      }
    } finally {
      // Don't set loading to false here - let the timeout handle it
    }
  };

  const stopScanner = () => {
    const inst = html5QrCodeRef.current;
    if (inst) {
      inst.stop().catch(() => {}).finally(() => {
        inst.clear();
        html5QrCodeRef.current = null;
      });
    }
  };

  const applyZoom = async (zoomLevel) => {
    try {
      const inst = html5QrCodeRef.current;
      if (!inst) return;

      const video = document.querySelector('#qr-reader video');
      if (!video || !video.srcObject) return;

      const track = video.srcObject.getVideoTracks()[0];
      if (!track) return;

      const cap = track.getCapabilities?.();

      if (cap?.zoom) {
        const clampedZoom = Math.max(cap.zoom.min, Math.min(zoomLevel, cap.zoom.max));
        await track.applyConstraints({ zoom: clampedZoom });
        video.style.transform = `scale(${clampedZoom})`;
        video.style.transformOrigin = 'center center';
      } else {
        // Fallback digital zoom if hardware zoom not supported
        const scaleVal = Math.max(1, Math.min(zoomLevel, 4));
        video.style.transform = `scale(${scaleVal})`;
        video.style.transformOrigin = 'center center';
      }
    } catch (e) {
      console.warn('Zoom not supported:', e.message);
    }
  };

  const parseTokenId = () => {
    const parsed = parseInt(tokenId, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const loadDetailsManual = async () => {
    const parsedId = parseTokenId();
    if (!parsedId) {
      setMsg('Please enter a valid token ID.');
      setDetails(null);
      return;
    }
    setDetailsLoading(true);
    setMsg('');
    try {
      const res = await getTokenDetails(parsedId, null);
      setDetails(res);
      setMsg('Token details loaded.');
    } catch (err) {
      console.error(err);
      setDetails(null);
      if (err.response && err.response.data) {
        setMsg(typeof err.response.data === 'string' ? err.response.data : 'Failed to load token details.');
      } else {
        setMsg('Network error while loading token details.');
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleManualRedeem = async () => {
    const parsedId = parseTokenId();
    if (!parsedId) {
      setMsg('Please enter a valid token ID.');
      return;
    }
    setManualLoading(true);
    setMsg('');
    try {
      const res = await axiosClient.post('/tokens/redeem', { tokenId: parsedId });
      setMsg(res.data?.message || 'Token redeemed successfully.');
      setDetails(res.data);
      setTokenId('');
      
      // Trigger the servo gate when token is successfully redeemed
      try {
        const gateOpened = await triggerServoGate();
        if (gateOpened) {
          console.log('[UI] Servo gate opened for meal access');
        } else {
          console.warn('[UI] Servo gate trigger failed - please check ESP32 connection');
        }
      } catch (hardwareErr) {
        console.error('[UI] Hardware trigger error:', hardwareErr);
        // Continue anyway - token was still redeemed successfully
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setMsg(typeof err.response.data === 'string' ? err.response.data : 'Failed to redeem token.');
      } else {
        setMsg('Network error.');
      }
    } finally {
      setManualLoading(false);
    }
  };

  const tokenInfo = details ? details.token || details.Token : null;
  const studentInfo = details ? details.student || details.Student : null;
  const mealInfo = details ? details.meal || details.Meal : null;
  const qrGroupInfo = details ? details.qrGroup || details.QRGroup : null;

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

  const handleSaveEspUrl = () => {
    const info = setESP32BaseUrl(espUrlInput);
    setEspUrlInput(info.baseUrl);
    setEspUrlSource(info.source);
    setEspMsg(info.source === 'localStorage' ? 'ESP32 URL saved.' : 'ESP32 URL reset to default.' );
    setTimeout(() => setEspMsg(''), 4000);
  };

  const handleResetEspUrl = () => {
    const info = setESP32BaseUrl('');
    setEspUrlInput(info.baseUrl);
    setEspUrlSource(info.source);
    setEspMsg('ESP32 URL reset to default (.env).');
    setTimeout(() => setEspMsg(''), 4000);
  };

  const handleTestEsp = async () => {
    setEspTestLoading(true);
    setEspOnline(null);
    try {
      const ok = await checkESP32Status();
      setEspOnline(ok);
    } catch (err) {
      setEspOnline(false);
    } finally {
      setEspTestLoading(false);
    }
  };

  const handleManualUnlock = async () => {
    setEspUnlockLoading(true);
    try {
      const ok = await triggerServoGate();
      setEspMsg(ok ? 'Gate opened successfully.' : 'Gate trigger failed. Check ESP32 connection.');
    } catch (err) {
      setEspMsg('Gate trigger failed. Check ESP32 connection.');
    } finally {
      setTimeout(() => setEspMsg(''), 4000);
      setEspUnlockLoading(false);
    }
  };

  return (
    <div>
      <style>{`
        .esp32-card .input-group-text {
          min-width: 60px;
        }
        .esp32-card .btn {
          min-width: 110px;
        }
        .esp32-card .badge {
          font-size: 0.75rem;
        }
        #qr-reader video {
          transform: scaleX(-1);
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        #qr-reader {
          overflow: hidden;
          border-radius: 12px;
          background: #000;
        }
        .scanner-card {
          border-radius: 12px;
        }
      `}</style>
      
      {/* Gradient header */}
      <div className="dashboard-header card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <h1 className="h4 mb-2">Scan QR Code for Token Redemption</h1>
          <p className="mb-0 opacity-75">Scan a student's token QR code to redeem</p>
        </div>
      </div>

      {/* 2-Column Layout: Scanner on left, Details on right */}
      <div className="row g-3">
        {/* LEFT COLUMN: Scanner */}
        <div className="col-lg-6">
          <div className="card mb-3 esp32-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="card-title mb-0">ESP32 Connection</h5>
                <span className={`badge ${espUrlSource === 'localStorage' ? 'bg-info' : 'bg-secondary'}`}>
                  {espUrlSource === 'localStorage' ? 'Custom' : 'Default (.env)'}
                </span>
              </div>

              {espMsg && (
                <div className="alert alert-info py-2 mb-2">{espMsg}</div>
              )}

              <div className="input-group mb-2">
                <span className="input-group-text">URL</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="http://192.168.1.50"
                  value={espUrlInput}
                  onChange={(e) => setEspUrlInput(e.target.value)}
                />
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-primary" onClick={handleSaveEspUrl}>
                  Save
                </button>
                <button className="btn btn-outline-secondary" onClick={handleResetEspUrl}>
                  Reset
                </button>
                <button className="btn btn-outline-success" onClick={handleTestEsp} disabled={espTestLoading}>
                  {espTestLoading ? 'Testing...' : 'Test /status'}
                </button>
                <button className="btn btn-primary" onClick={handleManualUnlock} disabled={espUnlockLoading}>
                  {espUnlockLoading ? 'Unlocking...' : 'Unlock Gate'}
                </button>
                {espOnline !== null && (
                  <span className={`badge align-self-center ${espOnline ? 'bg-success' : 'bg-danger'}`}>
                    {espOnline ? 'Online' : 'Offline'}
                  </span>
                )}
              </div>

              <small className="text-muted d-block mt-2">
                Tip: If you enter just an IP (e.g., 192.168.1.50) it will be saved as http://192.168.1.50
              </small>
            </div>
          </div>

          <div className="card scanner-card">
            <div className="card-body">
              <h5 className="card-title mb-3">Scanner</h5>
              
              {msg && (
                <div className={`alert ${msg.includes('✅') ? 'alert-success' : msg.includes('Processing') ? 'alert-info' : 'alert-warning'} mb-3`}>
                  <div className="d-flex align-items-center">
                    {msg.includes('✅') && <i className="bi bi-check-circle-fill me-2" style={{fontSize: '1.5rem'}}></i>}
                    {msg.includes('Processing') && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                    <span>{msg}</span>
                  </div>
                </div>
              )}

              {scanPaused && (
                <div className="alert alert-info mb-3">
                  <i className="bi bi-pause-circle me-2"></i>
                  Scanner paused. Resuming in a few seconds...
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Camera:</label>
                <select 
                  className="form-select form-select-sm" 
                  value={cameraId} 
                  onChange={async (e) => {
                    setCameraId(e.target.value);
                    await initQrScanner(e.target.value);
                  }}
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>{c.label || c.id}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Zoom:</label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="range"
                    className="form-range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => {
                      const z = parseFloat(e.target.value);
                      setZoom(z);
                      applyZoom(z);
                    }}
                  />
                  <span className="badge bg-secondary" style={{ minWidth: '50px' }}>{zoom.toFixed(1)}x</span>
                </div>
              </div>

              <div id="qr-reader" style={{ width: '100%', minHeight: '400px' }}></div>

              {loading && (
                <div className="mt-2 text-center">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Processing...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Token Details */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Token Details & Manual Verify</h5>

              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label">Token ID</label>
                  <input
                    type="number"
                    className="form-control"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    placeholder="Enter token ID to inspect"
                  />
                </div>
                <div className="col-12 d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-outline-primary flex-fill"
                    onClick={loadDetailsManual}
                    disabled={detailsLoading || manualLoading}
                    style={{ minWidth: '140px' }}
                  >
                    {detailsLoading ? 'Loading...' : 'Load Details'}
                  </button>
                  <button
                    className="btn btn-primary flex-fill"
                    onClick={handleManualRedeem}
                    disabled={manualLoading}
                    style={{ minWidth: '160px' }}
                  >
                    {manualLoading ? 'Redeeming...' : 'Verify & Redeem'}
                  </button>
                </div>
              </div>

              {!tokenInfo ? (
                <div className="text-center text-muted py-4">
                  <p className="mb-1">Scan a QR code or enter a token ID to view details.</p>
                </div>
              ) : (
                <>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h6 className="text-uppercase text-muted mb-2">Token Information</h6>
                      <div className="mb-1"><strong>ID:</strong> {tokenInfo.id || tokenInfo.Id}</div>
                      <div className="mb-1"><strong>UID:</strong> {tokenInfo.tokenUid || tokenInfo.TokenUid || '—'}</div>
                      <div className="mb-1"><strong>Date:</strong> {formatDate(tokenInfo.date || tokenInfo.Date)}</div>
                      <div className="mb-1"><strong>Slot:</strong> {tokenInfo.mealType || tokenInfo.MealType || '—'}</div>
                      <div className="mb-1"><strong>Price:</strong> ৳{tokenInfo.price ?? tokenInfo.Price ?? '—'}</div>
                      <div className="mb-1"><strong>Status:</strong> {tokenInfo.status || tokenInfo.Status || '—'}</div>
                    </div>

                    <div className="col-md-6">
                      <h6 className="text-uppercase text-muted mb-2">Redemption</h6>
                      <div className="mb-1"><strong>Redeemed at:</strong> {formatDateTime(tokenInfo.redeemedAt || tokenInfo.RedeemedAt)}</div>
                      <div className="mb-1"><strong>Preference:</strong> {tokenInfo.mealPreference || tokenInfo.MealPreference || 'Not set'}</div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="row g-4">
                    <div className="col-md-6">
                      <h6 className="text-uppercase text-muted mb-2">Student Information</h6>
                      <div className="mb-1"><strong>Name:</strong> {studentInfo ? studentInfo.fullName || studentInfo.FullName : '—'}</div>
                      <div className="mb-1"><strong>Email:</strong> {studentInfo ? studentInfo.email || studentInfo.Email : '—'}</div>
                      <div className="mb-1"><strong>User Code:</strong> {studentInfo ? studentInfo.userCode || studentInfo.UserCode : '—'}</div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-uppercase text-muted mb-2">Meal Details</h6>
                      <div className="mb-1"><strong>Date:</strong> {mealInfo?.date || mealInfo?.Date || '—'}</div>
                      <div className="mb-1"><strong>Slot:</strong> {mealInfo?.slot || mealInfo?.Slot || '—'}</div>
                      <div className="mb-1"><strong>Items:</strong> {mealInfo?.itemsText || mealInfo?.ItemsText || 'No menu found for this slot.'}</div>
                    </div>
                  </div>

                  {qrGroupInfo && (
                    <>
                      <hr className="my-4" />
                      <div className="row g-4">
                        <div className="col-12">
                          <h6 className="text-uppercase text-muted mb-3 text-success">
                            <i className="bi bi-qr-code me-2"></i>QR Code Bundle Information
                          </h6>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="mb-2"><strong>QR Group ID:</strong> {qrGroupInfo.qrGroupId || qrGroupInfo.QRGroupId}</div>
                              <div className="mb-2"><strong>QR Code:</strong> {qrGroupInfo.qrCode || qrGroupInfo.QRCode}</div>
                              <div className="mb-2"><strong>Total Tokens:</strong> {qrGroupInfo.totalTokens || qrGroupInfo.TotalTokens}</div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-2"><strong>Redeemed:</strong> {qrGroupInfo.redeemedTokens || qrGroupInfo.RedeemedTokens}</div>
                              <div className="mb-2">
                                <strong>Remaining:</strong>
                                <span className={`badge ms-2 ${(qrGroupInfo.remainingTokens || qrGroupInfo.RemainingTokens) > 0 ? 'bg-success' : 'bg-secondary'}`}>
                                  {qrGroupInfo.remainingTokens || qrGroupInfo.RemainingTokens} left
                                </span>
                              </div>
                              <div className="mb-2"><strong>Status:</strong> {qrGroupInfo.status || qrGroupInfo.Status}</div>
                            </div>
                          </div>
                          <div className="alert alert-info mt-3 mb-0">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Each scan decreases 1 token from the bundle.</strong> Student needs to scan {qrGroupInfo.remainingTokens || qrGroupInfo.RemainingTokens} more time(s) to use all tokens.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminScan;