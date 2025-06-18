const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  let likesCount = 0;

  test('1. Viewing one stock', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        assert.equal(res.body.stockData.stock, 'GOOG');
        likesCount = res.body.stockData.likes;
        done();
      });
  });

  test('2. Viewing one stock and liking it', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.property(res.body.stockData, 'likes');
        assert.isAtLeast(res.body.stockData.likes, likesCount); // like should be >= previous
        likesCount = res.body.stockData.likes;
        done();
      });
  });

  test('3. Viewing the same stock and liking it again (should not increase)', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.likes, likesCount); // like count should not increase
        done();
      });
  });

  test('4. Viewing two stocks', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'] })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData.length, 2);

        const [stock1, stock2] = res.body.stockData;
        assert.property(stock1, 'stock');
        assert.property(stock1, 'price');
        assert.property(stock1, 'rel_likes');

        assert.property(stock2, 'stock');
        assert.property(stock2, 'price');
        assert.property(stock2, 'rel_likes');
        done();
      });
  });

  test('5. Viewing two stocks and liking them', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: ['GOOG', 'MSFT'], like: true })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData.length, 2);

        const [stock1, stock2] = res.body.stockData;
        assert.property(stock1, 'stock');
        assert.property(stock1, 'price');
        assert.property(stock1, 'rel_likes');

        assert.property(stock2, 'stock');
        assert.property(stock2, 'price');
        assert.property(stock2, 'rel_likes');

        // rel_likes should be opposite
        assert.equal(stock1.rel_likes, -stock2.rel_likes);
        done();
      });
  });
});
