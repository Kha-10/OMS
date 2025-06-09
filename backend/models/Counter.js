const mongoose = require('mongoose');

// Counter Schema to handle sequential IDs
const counterSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true 
  },  // The name/identifier of the counter (e.g., 'orderNumber', 'invoiceNumber')
  seq: { 
    type: Number, 
    default: 0 
  },
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;