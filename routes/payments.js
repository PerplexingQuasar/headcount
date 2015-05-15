var express = require('express');
var router = express.Router();
var stripe = require("stripe")("sk_test_EfNB8XzSZodwZjCx6BFtz6Ci");
var User  = require('./../app/models/user');

router.post('/token', function(req, res){

	// Get the credit card token and amount submitted by the form
	var token = req.body.token;
	var amount = req.body.amount;

	// Charge the customer
	var charge = stripe.charges.create({
	  amount: amount, // amount in cents, again
	  currency: "usd",
	  source: token,
	  description: "Example charge"
	}, function(err, charge) {
	  if (err && err.type === 'StripeCardError') {
	    console.log('The card has been declined.');
	    res.status(401).json({error: 'The card has been declined'});
	  } else {
	  	console.log('Card was successfuly charged');
	  	res.status(201).json({success: 'The card was successfullly charged', amount: '$' + amount});
	  }
	});
});

module.exports = router;