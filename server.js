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
const targets = require('./targets.json').targets;

// Changable options 
let mute = true;


// Things to run when script loads
init();



// Serve the public directory directly
app.use(express.static('public'));

// Triggered by uptime robot
app.all("/" + process.env.BOT_ENDPOINT, function (request, response) {
  console.log("The bot has been triggered!!!");
  
  runTriggerLoop();
  
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
  checkTargetInDb(targets);
}


function checkTargetInDb(targets) {
  targets.forEach(user => {
    let userInDb = db.has(user).value();
    console.log("Checking if " + user + " is in the database...", userInDb);
    if (userInDb) return;
    // If user not in DB try to set them up after a delay
    setTimeout(() => {
      setupNewTargets(user);
    }, 2000)
  });
}


// Function to drop the database for testing (be careful)
function dropEntireDatabase() {
  const newState = {}
  db.setState(newState)
  db.write()
}



async function setupNewTargets (userName) {
  console.log('Setting up ' + userName + " in the database...");
  
  let favesRaw = await getRawFaves(userName);
  let favesExtracted = favesRaw.map(elem => {
    return elem.id_str + "," + elem.user.screen_name
  });
  
  db.set(userName, favesExtracted)
    .write();
}


// Some async await functions to try
async function getRawFaves(username) {
  var faves = await T.get('favorites/list', { screen_name: username })
    .catch(function (err) {
      console.log('Caught error:', err.stack)
    });
  return faves.data;
}

async function getExtractedFaves(username) {
  let favesExtracted = extractFaves(await getRawFaves(username));
  return favesExtracted;
}

function extractFaves(rawFaves) {
  return rawFaves.map(elem => {
    return elem.id_str + "," + elem.user.screen_name
  });
}

/*
 * THE MAIN LOOP
 *--------------------------------------*/

// This gets processed every 25 minutes
function runTriggerLoop() {
  console.log("Checking all targets for new faves...")
  targets.forEach(async target => {
    // Connect to Twitter and grab the faves
    let currentFaves = await getExtractedFaves(target);

    // Get stored faves from the time before
    let previouslyFaved = db.get(target).value() || [];

    // See if there are any new faves by minusing the old ones
    let newFaves = currentFaves.diff(previouslyFaved);
    
    console.log(newFaves);    
    // Tweet any new faves
    newFaves.forEach(async commaSeparatedFaves => {
      // Split up our string of values to we can parse them
      let faves = commaSeparatedFaves.split(",");
      
      console.log('Tweeting faved tweet...')
      let response = await T.post('statuses/update', 
             { status: target + ' liked this tweet: ' + "https://twitter.com/" + faves[1] + "/status/" + faves[0] })
      .catch(function (err) {
        console.log('Caught error:', err.stack)
      });
      
      console.log('Tweeting finished!');
    });
    
    // Write current faves to database ready for next check
    db.set(target, currentFaves)
      .write();
  });
}


