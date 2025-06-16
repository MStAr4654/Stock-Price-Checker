/*
'use strict';

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      
    });
    
};
*/
/*
'use strict';
const fetch = require('node-fetch');
const Stock = require('../models/Stock');
const sha256 = require('crypto').createHash;

function getIP(req) {
  const ip = req.ip || req.connection.remoteAddress;
  // Optional: hash or anonymize it, here's a simple hash:
  return require('crypto').createHash('sha256').update(ip).digest('hex');
}

module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    const { stock, like } = req.query;
    const ip = getIP(req);

    try {
      // normalize single or double stock
      const stocks = Array.isArray(stock) ? stock : [stock];
      const results = [];

      for (const s of stocks) {
        const stockSymbol = s.toUpperCase();
        const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`);
        const data = await response.json();

        if (!data.symbol) return res.json({ error: 'invalid symbol' });

        let stockDoc = await Stock.findOne({ symbol: stockSymbol });
        if (!stockDoc) {
          stockDoc = new Stock({ symbol: stockSymbol, likes: [], likeCount: 0 });
        }

        if (like === 'true' && !stockDoc.likes.includes(ip)) {
          stockDoc.likes.push(ip);
          stockDoc.likeCount++;
          await stockDoc.save();
        }

        results.push({
          stock: data.symbol,
          price: data.latestPrice,
          likes: stockDoc.likeCount
        });
      }

      if (results.length === 1) {
        res.json({ stockData: results[0] });
      } else {
        // compute relative likes
        const [s1, s2] = results;
        res.json({
          stockData: [
            { stock: s1.stock, price: s1.price, rel_likes: s1.likes - s2.likes },
            { stock: s2.stock, price: s2.price, rel_likes: s2.likes - s1.likes },
          ],
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

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


*/
'use strict';
const fetch = require('node-fetch');
const Stock = require('../models/Stock');
const crypto = require('crypto');

function getHashedIP(req) {
  const ip = req.ip || req.connection.remoteAddress;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

module.exports = function (app) {
  app.get('/api/stock-prices', async function (req, res) {
    const { stock, like } = req.query;
    const ipHash = getHashedIP(req);
    const isLike = like === 'true';

    const stocks = Array.isArray(stock) ? stock : [stock];
    try {
      const results = await Promise.all(
        stocks.map(async (symbol) => {
          const upperSymbol = symbol.toUpperCase();
          const apiUrl = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${upperSymbol}/quote`;

          const response = await fetch(apiUrl);
          const data = await response.json();

          if (!data.symbol || typeof data.latestPrice !== 'number') {
            throw new Error('invalid symbol');
          }

          let stockDoc = await Stock.findOne({ symbol: upperSymbol });
          if (!stockDoc) {
            stockDoc = new Stock({ symbol: upperSymbol, likes: [] });
          }

          if (isLike && !stockDoc.likes.includes(ipHash)) {
            stockDoc.likes.push(ipHash);
            await stockDoc.save();
          }

          return {
            stock: upperSymbol,
            price: data.latestPrice,
            likes: stockDoc.likes.length,
          };
        })
      );

      if (results.length === 1) {
        return res.json({ stockData: results[0] });
      } else {
        const [a, b] = results;
        return res.json({
          stockData: [
            {
              stock: a.stock,
              price: a.price,
              rel_likes: a.likes - b.likes,
            },
            {
              stock: b.stock,
              price: b.price,
              rel_likes: b.likes - a.likes,
            },
          ],
        });
      }
    } catch (err) {
      console.error(err.message);
      return res.status(400).json({ error: 'invalid stock symbol' });
    }
  });
};

