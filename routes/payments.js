var express = require('express');
var router = express.Router();
var stripe = require("stripe")("sk_test_S93fylBvsuMMemLE9Aj8A7Eo");
var User  = require('./../app/models/user');
var Payments  = require('./../utils/payments');


router.post('/token', function(req, res){

	// Get the credit card token and amount submitted by the form
	var request = {
		token: req.body.token,
		user: req.body.user,
		userId: null,
		eventId: req.body.eventId,
		amount: req.body.amount
	}

	Payments.addPaymentToken(request);
	//check threshhold payment
	console.log('request Data', request);
	//add this thing to the database
		//if the amount is greater than threshold amount, charge it to each invite on the event
		//

	// Charge the customer
	var charge = stripe.charges.create({
	  amount: request.amount, // amount in cents, again
	  currency: "usd",
	  source: request.token,
	  description: "Example charge"
	}, function(err, charge) {
	  if (err && err.type === 'StripeCardError') {
	    console.log('The card has been declined.');
	    res.status(401).json({error: 'The card has been declined'});
	  } else {
	  	console.log('Card was successfuly charged');
	  	res.status(201).json({success: 'The card was successfullly charged', amount: '$' + request.amount});
	  }
	});
});

module.exports = router;