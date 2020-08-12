const mongoose = require('mongoose');
const employeeSchema = mongoose.Schema({
    storeid: String,
    employeeid: String,
    firstName: String,
    lastName: String,
    empUserName : String,
    phoneNo: String,
    profileUrl: String,    
    email: String,
    loginType: String,
    profileUrl : String,
    firebaseuserid: {
        type:String,
        default: null
    },
    userType:{
        admin: Boolean,
        packingHelper: Boolean,
        delivery: Boolean,
        manager: Boolean
    },
    permissions:{
        revenue_view: Boolean,
        inventory_management:Boolean,
        timeslot_Pickup: Boolean,
        timeslot_Delivery: Boolean
    },
    onduty:{
        type:Boolean,
        default: false
    },
    storeName:{
        type:String,
        default: null
    },
    storeAddress:{
        type:String,
        default: null
    }
});

module.exports = mongoose.model('employees', employeeSchema);