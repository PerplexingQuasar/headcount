
angular.module('headcount.events', ['flash'])

.controller('EventsPayment', function($scope, $http, $timeout, $anchorScroll, $location, Flash,EventsFactory) {
  


  $scope.successAlert = function () {
    var message = '<strong> Well done!</strong>  Your card was successfully charged.';
    Flash.create('success', message, 'custom-class');
    // First argument (success) is the type of the flash alert
    // Second argument (message) is the message displays in the flash alert
    // You can inclide html as message (not just text)
    // Third argument (custom-class) is the custom class for the perticular flash alert
  }
  // Disables the submit payment button
  $scope.payBtnClickable = false;

  // Variable that contains the stripe error messages
  $scope.stripeError = '';

  //Display/hide credit card form
  $scope.displayPayment = false;

  $scope.display = function(){
    $scope.displayPayment = true;
  };

  // Contains the information of the user's credit card
  $scope.card = {};
  $scope.card.number="";
  $scope.card.cvc="";
  $scope.card.expirationMonth="";
  $scope.card.expirationYear="";

  // Set the stripe publishable key. This key will used to generate a credit card token
  Stripe.setPublishableKey('pk_test_oexI0bw5PDtL452kuxZtQX0I');

  // Amount to charge the client. To define the value we are dividing the number of person who joined by the cost of the event
  $scope.card.amount = $scope.event.thresholdMoney / $scope.event.thresholdPeople ;
  // Generate the client's token
  $scope.generateClientToken = function() {
      console.log('card', $scope.card);
      // Invoke the Stripe API method to generate the token
      Stripe.createToken({
          number: $scope.card.number,
          cvc: $scope.card.cvc,
          exp_month: $scope.card.expirationMonth,
          exp_year: $scope.card.expirationYear
      }, $scope.card.amount, stripeResponseHandler);

  };

  // handle the requests from the Stripe server
  function stripeResponseHandler(status, response) {
      if (response.error) {
          // re-enable the submit button
          $scope.payBtnClickable = true;
          // show the errors on the form
          $scope.stripeError = response.error.message;
      } else {
          var form$ = $("#payment-form");
          // token contains id, last4, and card type
          $scope.token = response['id'];

          // Send the token the server in this route: /payments/token
          $http.post('/payments/token', {
            token: $scope.token,
            amount: $scope.card.amount,
            user:sessionStorage.getItem('user'),
            eventId: EventsFactory.currentEvent,
            userId: null
          })
          // 
          // 
          // 
          // 
            .success(function(data, status, headers, config){
              console.log('Status:', status, 'Message: Token sent to the server');
              //redirect back to the main events page on successful payment
              $timeout(function(){
                $location.url('/events');
                // window.location.href="#/events";
               }, 1000);
              $scope.successAlert();
              //FIND OUT WHY LOCATION IS NOT DEFINED
              // $location.hash('header');
              $anchorScroll();
              // alert("Thanks for paying for this sweet event, yo.");
            })
            .error(function(data, status, headers, config){
              console.log('Status:', status, 'Message: Failed attempt, blame Jimmy.');
              console.log('data', data);
              console.log('status', status);
              console.log('headers', headers);
              console.log('config', config);
            });

      }
  }

})

.controller('EventsController', function($scope, $http, $window, $timeout, $q, EventsFactory) {

    // Stores all events that were created by you or that you were invited to
    $scope.user = {
        title: '',
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        address: '',
        city: '',
        state: '',
        description: '',
        postalCode: ''
    };
    $scope.events = [];
    $scope.event = EventsFactory.currentEvent;
    $scope.shouldNotBeClickable = EventsFactory.shouldNotBeClickable;
    $scope.showEvent = false;
    $scope.showNewEvent = true;

    /* userList currently populates with all users of Headcount. invitedUsers
     * gets pushed with any users you invite.
     */

    $scope.userList = [];
    $scope.invitedUsers = [];

    $scope.hasStripe = false;
    $scope.needInfo = false;
    $scope.shouldNotBeClickable = true;

    $scope.display = false;

    $scope.displayNewEvent = function() {
        $scope.showNewEvent = true;
    };

    $scope.saveEvent = function(link) {
        $scope.showEvent = true;
        EventsFactory.currentEvent = link;

    };

    // Event object that's populated via creation form and then posted for creation
    $scope.newEvent = {
        title: 'Title goes here',
        description: 'Description goes here',
        expiration: new Date(new Date().setDate(new Date().getDate() + 20)),
        thresholdPeople: 10,
        thresholdMoney: 100
    };

    // Checks to see if there's currently a clicked event, if not, it sends them back to the events list

    // $scope.checkEventClick = function() {
    //   if ($scope.event.image === undefined) {
    //     $window.location.href = "#/events";
    //   }
    // };

    // $scope.checkEventClick();

    // Fetch events that were created by you.

    $scope.fetchEvents = function() {
      console.log("EVENTS ARE BEING FETCHED");
        return $http({
                method: 'GET',
                url: '/events-fetch'
            })
            .then(function(resp) {
              console.log("INSIDE THEN");

                if (resp.data.length >= 1) {
                  console.log("resp.data.length",resp.data);

                    $scope.events = resp.data;
                    console.log('EVENTSSSS', $scope.events);
                } else {
                    console.log("THERE ARE NO EVENTS TO FETCH!!!");
                }
            });
    };

    /* Fetches invited events. We're using two methods, one to fetch invite IDs, which are
     * then fed to another method which actually fetches the events.
     */


    $scope.fetchInviteIDs = function() {
        return $http({
                method: 'GET',
                url: '/invite-events-fetch'
            })
            .then(function(resp) {
                $scope.fetchInviteEvents(resp.data);
            });
    };

    $scope.fetchInviteEvents = function(ids) {
        return $http({
                method: 'POST',
                url: '/invite-events-fetch',
                data: {
                    ids: ids
                }
            })
            .then(function(resp) {
                for (var i = 0; i < resp.data.length; i++) {
                    $scope.events.push(resp.data[i]);
                }
            });
    };

    $scope.fetchInviteIDs();
    $scope.fetchEvents();

    // Fetches users from the database that are not current user

    var self = this;
    $scope.fetchUsers = function() {
        return $http({
                method: 'GET',
                url: '/users-fetch'
            })
            .then(function(resp) {
                $scope.userList = resp.data;
                console.log("USER LIST!!!" + $scope.userList);

                self.querySearch = querySearch;
                self.allContacts = loadContacts();
                self.contacts = [self.allContacts[0]];
                self.filterSelected = true;
                /**
                 * Search for contacts.
                 */
                function querySearch(query) {
                        var results = query ?
                            self.allContacts.filter(createFilterFor(query)) : [];
                        return results;
                    }
                    /**
                     * Create filter function for a query string
                     */
                function createFilterFor(query) {
                    console.log('filtering');
                    var lowercaseQuery = angular.lowercase(query);
                    return function filterFn(contact) {
                        return (contact._lowername.indexOf(lowercaseQuery) != -1);;
                    };
                }

                function loadContacts() {
                    var contacts = [];
                    for (var i = 0; i < $scope.userList.length; i++) {
                        contacts.push([$scope.userList[i][0], $scope.userList[i][1]]);
                    }

                    return contacts.map(function(c, index) {
                        var cParts = c[0].split(' ');
                        var contact = {
                            name: c[0],
                            id: c[1],
                            image: 'http://lorempixel.com/50/50/people?' + index
                        };
                        contact._lowername = contact.name.toLowerCase();
                        return contact;
                    });
                }
            });
    };
    $scope.fetchUsers();

    /**
     * Creates an event with $scope.newEvent data
     */
    $scope.createEvent = function() {
        var inv = [];
        var list = $('.selected .compact');
        for (var i = 0; i < list.length; i++) {
            inv.push(list[i].children[0].innerText);
        }
        // console.log('inv',inv);
        $scope.invitedUsers = inv;

        // Set the host of the event
        $scope.newEvent.host = sessionStorage.getItem('user');


        $scope.newEvent.invited = $scope.invitedUsers;
        console.log('Event details', $scope.newEvent.image);
        if(!$scope.newEvent.image){
          console.log('defaultEventImage');
          $scope.newEvent.image = 'assets/defaultEventImage.jpg';
        }
        return $http({
                method: 'POST',
                url: '/events-create',
                data: $scope.newEvent
            })
            .then(function(resp) {
                $window.location.href = "/";
            });
    };

    $scope.acceptOrDeclineInvite = function(acceptOrDeclineBoolean, $event) {
        console.log('accepting invite?', acceptOrDeclineBoolean);

        var eventId = this.event.id;
        return $http({
                method: 'POST',
                url: '/invite-response',
                data: {
                    eventId: eventId,
                    accepted: acceptOrDeclineBoolean
                }
            })
            .then(function(resp) {

                $scope.updateEventInfo(resp, $event);

            });
    };

    /**
     * Updates event info on 'join' or 'decline' action.
     * Invoked by $scope.acceptOrDeclineInvite
     */
    $scope.updateEventInfo = function(resp, $event) {
        // console.log(resp);

        var numNeeded = Number(resp.data.eventInfo.thresholdPeople);
        var cashNeeded = Number(resp.data.eventInfo.thresholdMoney);
        var cashPerPerson = cashNeeded / numNeeded;
        var numCommitted = Number(resp.data.eventInfo.committedPeople);

        $event.thresholdPeople = numNeeded - numCommitted;
        $event.thresholdMoney = cashNeeded - (cashPerPerson * numCommitted);
    };

    /**
     * Prevents user from joining or decline event if:
     * -- A) User has not authorized his/her Venmo account
     * -- B) User is the account creator
     */
    $scope.checkEventPermissions = function() {

        var currentUser = sessionStorage.getItem('user');
        return $http({
                method: 'POST',
                url: '/users/checkUser',
                data: {
                    'username': currentUser
                }
            })
            .then(function(resp) {
                var hasVenmoInfo = resp.data.hasVenmoInfo;
                var disabledEventIds = resp.data.relatedEventIds;

                if (!hasVenmoInfo) {
                    console.log('Cannot join or decline, you have not authorized your Venmo account yet!');
                } else {
                    console.log('venmo authorized');
                }

                EventsFactory.shouldNotBeClickable = !hasVenmoInfo;
                $scope.shouldNotBeClickable = !hasVenmoInfo;
                EventsFactory.shouldNotBeCreatable = !hasVenmoInfo;
                $scope.shouldNotBeCreatable = !hasVenmoInfo;

                /**
                 * Checks joining/declining event permissions if on single event page
                 */
                if ($scope.event.user_id && $scope.event.id) {

                    /**
                     * Prevents joining or decline events if you are the event creator
                     */
                    if ($scope.event.user_id === resp.data.userID.toString()) {
                        console.log('Cannot join or decline, you created this event!');
                        $scope.shouldNotBeClickable = true;
                    }

                    /**
                     * Prevents user from joining or decline if they are did one or the other
                     */
                    if (disabledEventIds) {
                        for (var i = 0; i < disabledEventIds.length; i++) {
                            if (disabledEventIds[i].toString() === $scope.event.id.toString()) {
                                console.log('Cannot join or decline, you already did!');
                                $scope.shouldNotBeClickable = true;
                            }
                        }
                    }

                }
            });
    };

    $scope.checkEventPermissions();

    $scope.showDetails = function() {
        if ($scope.showCreate === true) {
            $scope.showCreate = false;
        } else {
            $scope.showCreate = true;
        }
    };


});
