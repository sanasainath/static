import React, { useState, useEffect } from 'react';
import { getCombinedData } from './compo/Apis';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function App() {
  const [month, setMonth] = useState('March');
  const [page, setPage] = useState(1);
  const [perPage] = useState(4);
  const [search, setSearch] = useState('');
  const [data, setData] = useState({
    transactions: {
      transactions: []
    },
    statistics: {},
    pieChartData: {},
    barChartData: {}
  });
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    const fetchData = debounce(async () => {
      setLoading(true); // Set loading to true when starting to fetch data
      try {
        const result = await getCombinedData(month, page, perPage, search);
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    }, 500); // Debounce delay

    fetchData();
  }, [month, page, perPage, search]);

  const barData = {
    labels: data.barChartData ? Object.keys(data.barChartData) : [],
    datasets: [
      {
        label: `Bar Chart Stats - ${month}`,
        data: data.barChartData ? Object.values(data.barChartData) : [],
        backgroundColor: 'rgba(72, 209, 204, 0.6)',
        borderColor: 'rgba(72, 209, 204, 1)',
        borderWidth: 1
      }
    ]
  };

  const barOptions = {
    scales: {
      y: {
        beginAtZero: true
      },
      x: {
        type: 'category',
        labels: data.barChartData ? Object.keys(data.barChartData) : []
      }
    }
  };

  const pieData = {
    labels: data.pieChartData ? Object.keys(data.pieChartData) : [],
    datasets: [
      {
        data: data.pieChartData ? Object.values(data.pieChartData) : [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
        ]
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return tooltipItem.label + ': ' + tooltipItem.raw;
          }
        }
      }
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Transaction Dashboard</h1>
      </div>
      <div className="controls">
        <input
          type="text"
          placeholder="Search transaction"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <label className="month-selector">
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <h2 className="section-title">Transactions List</h2>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Price</th>
                <th>Category</th>
                <th>Sold</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>{transaction.title}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.price}</td>
                  <td>{transaction.category}</td>
                  <td>{transaction.sold ? 'Yes' : 'No'}</td>
                  <td>
                    <img src={transaction.image} alt={transaction.title} className="transaction-image"/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
            <span>Page No: {page}</span>
            <button onClick={() => setPage((prev) => prev + 1)}>Next</button>
          </div>
          <div className="per-page">Per Page: {perPage}</div>

          <h2 className="section-title">Statistics</h2>
          <div className="statistics-table">
            <p>Total Sale Amount: {data.statistics.totalSaleAmount}</p>
            <p>Total Sold Items: {data.statistics.totalSoldItems}</p>
            <p>Total Not Sold Items: {data.statistics.totalNotSoldItems}</p>
          </div>

          <h2 className="section-title">Bar Chart</h2>
          <div className="chart">
            <Bar data={barData} options={barOptions} />
          </div>

          <h2 className="section-title">Pie Chart</h2>
          <div className="chart pie-chart">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
