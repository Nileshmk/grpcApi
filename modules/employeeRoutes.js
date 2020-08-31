var userSchema = require("../models/userSchema");
let app = require('../config/firebase');
// var chatOptionSchema = require("../models/chatSchema");
var orderSummarySchema = require("../models/OrderSummary");
var allocationSchema = require("../models/allocationSchema");
const employeeSchema = require("../models/employeeSchema");
const roomSchema = require("../models/roomSchema");
const orderSchema = require("../models/orderSchema");
const ObjectId = require("mongodb").ObjectID;
const storeProductsSchema = require("../models/storeProductsSchema");
const jsonQuery = require("json-query");
const grpc = require('grpc');

function getDutyEmployees(call, callback){
    const {storeid, Duty} = call.request;
    let temp = {storeid:storeid};
    tt = "permissions."+Duty;
    temp[tt] = true;
    try{
        employeeSchema.find(temp,"employeeid firstName lastName onDuty taskAssigned",async(err,employeesResult)=>{
            if(err) throw err;
            if(employeesResult.length!=0){
                return callback(null,{"employees":employeesResult});
            }
            else{
                return callback({code: grpc.status.NOT_FOUND,details: 'Not found'});
            }
        });
    }
    catch(err){
        return callback({code: grpc.status.NOT_FOUND,details: 'Not found'});
    }
}

function assignEmployeeTask(call, callback){
    const {employeeid,orderid,storeid,job} = call.request;
    try{
        roomSchema.findOne({storeid:storeid,"orders.orderid":orderid},async(err,roomResult)=>{
            if(err) throw err;
            if(roomResult){
                await employeeSchema.findOne({storeid:storeid,employeeid:employeeid},async(err,employeeResult)=>{
                    if(err) throw err;
                    if(employeeResult){
                        employeeResult.taskAssigned=employeeResult.taskAssigned+1;
                        employeeResult.save();
                        var r = await jsonQuery("orders[orderid="+orderid+"]", {data: roomResult}).value;
                        r.userlist.append({
                            id:employeeResult.employeeid,
                            firebaseuserid:employeeResult.firebaseuserid
                        });
                        let msg = {
                            messageid:roomResult.lastMessageId,
                            userid:employeeResult.employeeid,
                            messagetype:"assign",
                            timestamp:new Date(),
                            firstName:employeeResult.firstName,
                            lastName:employeeResult.lastName,
                            profilePicUrl:employeeResult.profileUrl,
                            senderUserType:job
                        };
                        if(job=="Packing"){
                            msg["orderstatuscode"]=203;
                            msg["message"]="Packing has been Assigned";
                        }
                        else{
                            msg["orderstatuscode"]=207;
                            msg["message"]="Delivery has been Assigned";
                        }
                        r.messages.append(msg);
                        for(let i = 0;i<r.userlist.length;i++){
                            sendFcm(r.userlist[i].firebaseuserid,"updated",(err,result)=>{
                                if(err) throw err;
                            });
                        }
                        return callback(null,{message:"success",response_code:200});
                    }
                    else{
                        return callback({code: grpc.status.NOT_FOUND,details: 'Not found'});
                    }
                });
                await roomResult.save();
            }
            else{
                return callback({code: grpc.status.NOT_FOUND,details: 'Not found'});
            }
        })
    }
    catch(err){
        return callback({code: grpc.status.NOT_FOUND,details: 'Not found'});
    }
}

function sendFcm(token,box,callback){
    var registrationToken = token;
    var message = {
      data : {
          "message":box
        },
      token: registrationToken
    };
    app.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      return callback(null,response);
    })
    .catch((error) => {
       return callback(error,null);
      // console.log('Error sending message:', error);
    });
}

module.exports = {getDutyEmployees,assignEmployeeTask};