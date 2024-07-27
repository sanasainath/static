const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors');
const Transaction = require('./models/Transaction');
const app = express();

const PORT = process.env.PORT || 5000;
dotenv.config({ path: './config.env' }); 
app.use(cors());
app.get('/init', async (req, res) => {  
    try {
      const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
      const transactions = response.data;
  
      await Transaction.deleteMany(); 
      await Transaction.insertMany(transactions); 
  
      res.status(200).json({ message: 'Database initialized with seed data' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error initializing database' });
    }
  });
  //get transactions..
  app.get('/transactions', async (req, res) => {
    const { page = 1, perPage = 10, search = '', month } = req.query;
  
    const monthNumber = new Date(Date.parse(`${month} 1, 2021`)).getMonth() + 1;
    const searchRegex = new RegExp(search, 'i');
    const query = {
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNumber]
      },
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    };
  
    try {
      const transactions = await Transaction.find(query)
        .skip((page - 1) * perPage)
        .limit(parseInt(perPage));
  
      const total = await Transaction.countDocuments(query);
  
      res.status(200).json({
        transactions,
        total,
        page: parseInt(page),
        perPage: parseInt(perPage)
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching transactions' });
    }
  });
  
  
  //.........................................statistics for particular Month..............................................


  app.get('/statistics', async (req, res) => {
    const { month } = req.query;
    console.log("month",month);
  
    // convert this to monthh to month number
    const monthNumber = new Date(Date.parse(`${month} 1, 2021`)).getMonth() + 1;
  
    try {
      //find match of that transaction.....
      const transactions = await Transaction.find({
        $expr: {
          $eq: [{ $month: "$dateOfSale" }, monthNumber]
        }
      });
  
     //values
      const totalSaleAmount = transactions.reduce((sum, transaction) => sum + (transaction.sold ? transaction.price : 0), 0);
      const totalSoldItems = transactions.filter(transaction => transaction.sold).length;
      const totalNotSoldItems = transactions.filter(transaction => !transaction.sold).length;
  
      
      res.status(200).json({
        totalSaleAmount,
        totalSoldItems,
        totalNotSoldItems
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching statistics' });
    }
  });
  
//....................................................bar chart api............................................

app.get('/bar-chart', async (req, res) => {
    const { month } = req.query;
  
   
    const monthNumber = new Date(Date.parse(`${month} 1, 2021`)).getMonth() + 1;
  
    try {
     
      const transactions = await Transaction.find({
        $expr: {
          $eq: [{ $month: "$dateOfSale" }, monthNumber]
        }
      });
  

      const priceRanges = {
        '0-100': 0,
        '101-200': 0,
        '201-300': 0,
        '301-400': 0,
        '401-500': 0,
        '501-600': 0,
        '601-700': 0,
        '701-800': 0,
        '801-900': 0,
        '901-above': 0
      };
  
     
      transactions.forEach(transaction => {
        if (transaction.price >= 0 && transaction.price <= 100) priceRanges['0-100']++;
        else if (transaction.price >= 101 && transaction.price <= 200) priceRanges['101-200']++;
        else if (transaction.price >= 201 && transaction.price <= 300) priceRanges['201-300']++;
        else if (transaction.price >= 301 && transaction.price <= 400) priceRanges['301-400']++;
        else if (transaction.price >= 401 && transaction.price <= 500) priceRanges['401-500']++;
        else if (transaction.price >= 501 && transaction.price <= 600) priceRanges['501-600']++;
        else if (transaction.price >= 601 && transaction.price <= 700) priceRanges['601-700']++;
        else if (transaction.price >= 701 && transaction.price <= 800) priceRanges['701-800']++;
        else if (transaction.price >= 801 && transaction.price <= 900) priceRanges['801-900']++;
        else if (transaction.price >= 901) priceRanges['901-above']++;
      });
  
     
      res.status(200).json(priceRanges);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching bar chart data' });
    }
  });
  

  //...............................................................Pie Chart...............................................
  app.get('/pie-chart', async (req, res) => {
    const { month } = req.query;
  
   
    const monthNumber = new Date(Date.parse(`${month} 1, 2021`)).getMonth() + 1;
  
    try {
    
      const transactions = await Transaction.find({
        $expr: {
          $eq: [{ $month: "$dateOfSale" }, monthNumber]
        }
      });
  
      
      const categoryCounts = {};
  
      //itemms couynted..
      transactions.forEach(transaction => {
        const category = transaction.category;
        if (categoryCounts[category]) {
          categoryCounts[category]++;
        } else {
          categoryCounts[category] = 1;
        }
      });
  
     
      res.status(200).json(categoryCounts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching pie chart data' });
    }
  });
  

//..................................................combined API...........................

app.get('/combined-data', async (req, res) => {
  const { month, page = 1, perPage = 10, search = '' } = req.query;

  try {
    // Fetch transactions
    const transactionsRes = await axios.get(`http://localhost:5000/transactions?page=${page}&perPage=${perPage}&search=${search}&month=${month}`);
    const transactions = transactionsRes.data;

    // Fetch statistics
    const statisticsRes = await axios.get(`http://localhost:5000/statistics?month=${month}`);
    const statistics = statisticsRes.data;

    // Fetch pie chart data
    const pieChartRes = await axios.get(`http://localhost:5000/pie-chart?month=${month}`);
    const pieChartData = pieChartRes.data;

    // Fetch bar chart data
    const barChartRes = await axios.get(`http://localhost:5000/bar-chart?month=${month}`);
    const barChartData = barChartRes.data;

    // Combine all data
    const combinedData = {
      transactions,
      statistics,
      pieChartData,
      barChartData
    };

    res.status(200).json(combinedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching combined data' });
  }
});

  



// MongoDB connection
mongoose.connect(process.env.CONN_STR, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB',process.env.CONN_STR);
});

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
