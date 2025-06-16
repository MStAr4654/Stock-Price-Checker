/*
'use strict';

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      
    });
    
};
*/
'use strict';
const fetch = require('node-fetch');
const Stock = require('../models/Stock');
const sha256 = require('crypto').createHash;


module.exports = function (app) {
  app.route('/api/stock-prices').get(async function (req, res) {
    try {
      const { stock, like } = req.query;
      const ip = req.ip || req.connection.remoteAddress;
      const hashedIp = sha256('sha256').update(ip).digest('hex');

      // Normalize stock input
      const stocks = Array.isArray(stock) ? stock : [stock];

      const getStockData = async (symbol) => {
        const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
        const data = await response.json();
        return {
          stock: data.symbol,
          price: data.latestPrice
        };
      };

      const results = await Promise.all(stocks.map(async (s) => {
        const symbol = s.toUpperCase();
        const stockData = await getStockData(symbol);

        let dbStock = await Stock.findOne({ symbol });
        if (!dbStock) {
          dbStock = new Stock({ symbol, likes: [] });
        }

        if (like && !dbStock.likes.includes(hashedIp)) {
          dbStock.likes.push(hashedIp);
          await dbStock.save();
        }

        return {
          stock: stockData.stock,
          price: stockData.price,
          likes: dbStock.likes.length
        };
      }));

      if (results.length === 1) {
        return res.json({ stockData: results[0] });
      } else {
        const [s1, s2] = results;
        return res.json({
          stockData: [
            {
              stock: s1.stock,
              price: s1.price,
              rel_likes: s1.likes - s2.likes
            },
            {
              stock: s2.stock,
              price: s2.price,
              rel_likes: s2.likes - s1.likes
            }
          ]
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
};
