import React, { useState, useEffect } from 'react';

const BankSelector = ({ onSelectBank }) => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const data = await response.json();

        if (data.code === "00") {
          setBanks(data.data); // Lưu danh sách ngân hàng vào state
        } else {
          setError("Không tải được danh sách ngân hàng.");
        }
      } catch (err) {
        setError("Lỗi kết nối.");
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

  if (loading) return <p>Đang tải danh sách ngân hàng...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="bank-select-container">
      <label htmlFor="bank-select">Chọn ngân hàng:</label>
      <select 
        id="bank-select" 
        onChange={(e) => {
            // Tìm object ngân hàng dựa trên ID hoặc Bin được chọn
            const selected = banks.find(b => b.bin === e.target.value);
            onSelectBank(selected);
        }}
        defaultValue=""
      >
        <option value="" disabled>-- Vui lòng chọn --</option>
        {banks.map((bank) => (
          <option key={bank.id} value={bank.bin}>
            {bank.shortName} ({bank.bin})
          </option>
        ))}
      </select>
      
      
    </div>
  );
};

export default BankSelector;