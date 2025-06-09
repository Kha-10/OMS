const mongoose = require('mongoose')

const schema = mongoose.Schema;

const NotificationSchema = new schema ({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
      },
      message: {
        type: String,
        required: true,
      },
      menuItemId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipe',
      },
      type: {
        type: String,
        enum: ['menu-expiration', 'new-order', 'system-alert'],
        required: true,
      },
      isRead: {
        type: Boolean, 
        default: false,
      }
},{timestamps : true});

module.exports = mongoose.model ("Notification",NotificationSchema)