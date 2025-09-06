const mongoose = require('../src/config/db');

describe('MongoDB Connection', () => {
  it('should connect to MongoDB successfully', async () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });
});
