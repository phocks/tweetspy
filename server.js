const fox = require('fox-js'); // Some custom functions etc

const low = require('lowdb') // Database
const FileSync = require('lowdb/adapters/FileSync')

const path = require('path'),
      express = require('express'),
      app = express(),   
      Twit = require('twit'),
      config = {     
        twitter: {
          consumer_key:         process.env.CONSUMER_KEY,
          consumer_secret:      process.env.CONSUMER_SECRET,
          access_token:         process.env.ACCESS_TOKEN,
          access_token_secret:  process.env.ACCESS_TOKEN_SECRET,
          timeout_ms:           60*1000,
        }
      },
      T = new Twit(config.twitter);

// Setting up the lowdb local database
const adapter = new FileSync('.data/db.json');
const db = low(adapter);

// A few constants and/or variables
const USERNAME = process.env.USERNAME;

// Set some defaults
db.defaults({ favs: [] }) 
  .write();

// Serve the public directory directly
app.use(express.static('public'));

app.all("/" + process.env.BOT_ENDPOINT, function (request, response) {
  console.log("The bot has been triggered!!!");
  
  // Call Twitter API 
  T.get('favorites/list', { screen_name: 'phocks' },  function (err, data, response) {

    // Get an array of faved tweet ids
    let currentFaved = data.map(elem => {
      return elem.id_str;
    });
    
    // Get stored faves from the time before
    let previouslyFaved = db.get('favs').value()
    
    console.log(previouslyFaved);
    
    console.log(currentFaved);
    
    console.log(currentFaved.diff( previouslyFaved ) );
    
    db.set('favs', currentFaved)
      .write();
    
    
  })
  
  response.sendStatus(200);
}); // app.all Express call


var listener = app.listen(process.env.PORT, function () {
  console.log('Your bot is running on port ' + listener.address().port);
});

// Get the difference between two arrays
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

// app.set('json spaces', 4);

// app.get("/loadfriends", (request, response) => {
//   T.get('friends/ids', { screen_name: 'phocks' },  function (err, data, res) {
//     // Add a post
//     db.set('friends', data.ids)
//       .write();
//     response.json(data);
//   })
// });

// app.all("/" + process.env.BOT_ENDPOINT, function (request, response) {

  
//   // Put recurring stuff here
  
//   let friends = db.get('friends').value() || [];
  
//   if (!friends[0]) {
//     response.status(200);
//     console.log('No friends left...');
//     response.send('No friends left...');
//     return false;
//   }
  

//     // console.log(friends);
  
//   console.log('starting operation')

//     fox.setIntervalX(muteUser,
//         1 * 1000, // Milliseconds between calls
//         20 // How many times
//       );
  
//   function removeRetweet () {
//       T.post('friendships/update', { user_id: friends[0], retweets: 'false' }, (err, data, res) => {
//         // if (err) response.send(err);
//         if (err) console.log(err);
        
//           console.log('Removed retweets from ' + friends[0]);
//           friends.shift();
//           db.set('friends', friends)
//             .write();
      
//           console.log("Left to do: " + friends.length)
//         });
//       }


  
//   function muteUser () {
//       T.post('mutes/users/create', { user_id: friends[0] }, (err, data, res) => {
//         // if (err) response.send(err);
//         if (err) console.log(err);
        
//           console.log('Muted user ' + friends[0]);
//           friends.shift();
//           db.set('friends', friends)
//             .write();
      
//           console.log("Left to do: " + friends.length)
//         });
//       }
  


// function addRetweet () {
//       T.post('friendships/update', { user_id: 5703342, retweets: 'true' }, (err, data, res) => {
//         // if (err) response.send(err);
//         if (err) console.log(err);
        
//           console.log('Added retweets from ' + 5703342, data);
//           // friends.shift();
//           // db.set('friends', friends)
//           //   .write();
      
//           // console.log("Left to do: " + friends.length)
//         });
//       }
      
    
// response.send('ok');

  
// }); // app.all Express call

// app.get("/testing", (request, response) => {
//   T.get('friends/ids', { screen_name: 'phocks' },  function (err, data, res) {
//     // db.set('friends', data.ids)
//     //   .write();
//     response.json(data);
//   })
// });

// var query = {
  //   q: "javascript -filter:nativeretweets",
  //   result_type: "recent",
  //   lang: "en",
  //   count: 100
  // }

//   T.get('search/tweets', query, function (error, data, response) {
//     if (error) {
//       console.log('Bot could not find latest tweets, - ' + error);
//     }
//     else {
//       var userList = "";
//       // console.log(data);
//       data.statuses.forEach(function (d, i) {
//         // console.log(d.user.screen_name);
//         if (userList === "") userList = userList + d.user.screen_name;
//         else userList = userList + "," + d.user.screen_name;
//       });
      
//       console.log(userList);
      
//       var params ={
//         screen_name: userList,
//         owner_screen_name: "phocks",
//         slug: "javascripters"
//       }
      
      
      
      // Uncomment below to process
      
      // T.post('lists/members/create_all', params, function (error, response) {
      //   if (error) {
      //       console.log('Bot could not do it, - ' + error);
      //     }
      //     else {
      //       console.log("Completed...")
      //       // console.log(response);
      //     }
      // });
    
      
      
      
      
      
      
//       var id = {
//         id : data.statuses[0].id_str
//       }
      
//       var currentUser = data.statuses[0].user.screen_name;
    
      
//       console.log("Current user: " + currentUser);
//       console.log(data.statuses[0].text);
      
      // T.post('favorites/create', id, function (error, response) {
      //     if (error) {
      //       console.log('Bot could not fav, - ' + error);
      //     }
      //     else {
      //       console.log('Bot faved : ' + id.id);
      //     }
      //   });
      
    // }
      
  // });