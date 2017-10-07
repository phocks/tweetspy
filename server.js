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

// Uncomment to immediately clear the database
// dropEntireDatabase();

// A few constants and/or variables
const currentUser = process.env.USERNAME;
const userList = ['phocks', 'larissawaters', 'JuliaGillard'];

// Changable options 
let mute = true;

init();




// Serve the public directory directly
app.use(express.static('public'));

// Triggered by uptime robot
app.all("/" + process.env.BOT_ENDPOINT, function (request, response) {
  console.log("The bot has been triggered!!!");
  
  // Call Twitter API 
  T.get('favorites/list', { screen_name: 'phocks' },  function (err, data, response) {

    // Get an array of faved tweet ids
    let currentFaved = data.map(elem => {
      return elem.id_str + "," + elem.user.screen_name
    });
    
    // Get stored faves from the time before
    let previouslyFaved = db.get(currentUser).value() || [];
    
    // See if there are any new faves by minusing the old ones
    let newFaves = currentFaved.diff(previouslyFaved);
    
    console.log(newFaves.length);
    
    // Tweet any new faves
    newFaves.forEach(element => {
      console.log(element.split(","));
      let parsedFaves = element.split(",")
      if (!mute) T.post('statuses/update', 
             { status: '(test tweet) Josh faved: ' + "https://twitter.com/" + parsedFaves[1] + "/status/" + parsedFaves[0] }, 
             function(err, data, response) {
        console.log("Tweeted about: ",  element)
      });
    });
    
    // console.log(newFaves );
    
    db.set(currentUser, currentFaved)
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

function init() {
  checkUsers();
}

function checkUsers() {
  userList.forEach(user => {
    let userInDb = db.has(user).value();
    console.log("Checking if " + user + " is in the database...", userInDb);
    if (userInDb) return;
    // If user not in DB try to set them up after a delay
    setTimeout(() => {
      console.log('Setting up ' + user);
    }, 5000)
  });
}

// Function to drop the database for testing (be careful)
function dropEntireDatabase() {
  const newState = {}
  db.setState(newState)
  db.write()
}