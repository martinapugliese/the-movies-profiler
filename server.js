// Imports
const express = require('express');
const uuid = require('uuid/v4')
var session = require('express-session');
const fetch = require('node-fetch');

// Global vars
const apiKey = process.env.MOVIEDB_API_KEY;   // the API key to TMDB API
var d = {}                                    // global object with session and movies info
d.movies = []

// Initialise express app
const app = express();
app.use(express.static('public'))

//TODO Download daily dump of keywords and genre IDs
// Other Interesting data:, belongs_to_collection, genres, original_language, popularity
// production_companies, production_countries, runtime, tagline, recommendations,
// credits (cast & crew), images
//Note there is crew as well against the person credits
// TODO need a error handling when movie not found (no results)
//TODO tell user if movie selected (first) is good (button?)

// Session configuration
app.use(session({
  genid: (req) => {
    console.log('Inside the session middleware')
    return uuid()
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}))

app.get("/", (appRequest, appResponse) => {
  console.log('Inside the homepage callback function')
  console.log(appRequest.sessionID)
  appResponse.sendFile(__dirname + '/views/index.html')
})

app.get("/movie", (appRequest, appResponse) => {
  console.log('Inside the movie function')
  console.log(appRequest.sessionID)
  appResponse.sendStatus(200);
})

const AsyncFetch = async url => {
  let response = await (await fetch(url)).json();
  return response;
}

const multiFetchAsync = async (appRequest, configBody, searchURL) => {
  try {
    
    var response = await (await fetch(searchURL)).json();
    const id = response.results[0].id
    
    // Movie details endpoint
    const movieURL = 'https://api.themoviedb.org/3/movie/' + id + '?api_key=' + apiKey + '&language=en-US' + 
                     '&append_to_response=keywords,recommendations,credits,images'
    var response = await (await fetch(movieURL)).json();
    const overview = response.overview
    const title = response.title
    const originalTitle = response.original_title
    const originalLanguage = response.original_language  // TODO "it", in config there is endpoint for getting langs
    const revenue = response.revenue
    const score = response.vote_average
    const numVotes = response.vote_count    // TODO compute age in years
    const releaseDate = response.release_date
    const budget = response.budget    // TODO need to check for when unknown comes as 0? (same for revenue)
    const genres = response.genres
    const keywords = response.keywords
    const recommendations = response.recommendations
    const images = response.images
    
    // Fetch data against the main cast (first 5 in order of insertion)
    var mainCast = response.credits.cast.filter((item => item.order <= 5))
    for (var i=0; i < mainCast.length; i++) {
      
      // Person endpoint
      var personURL = 'https://api.themoviedb.org/3/person/' + mainCast[i].id + '?api_key=' + apiKey + 
                      '&language=en-US&append_to_response=movie_credits'
      var response = await (await fetch(personURL)).json();
      var personScores = []
      for (var j=0; j < response.movie_credits.cast.length; j++) {
        personScores.push(response.movie_credits.cast[j].vote_average)
      }
      mainCast[i]['score'] = personScores.reduce((a, b) => a + b) / personScores.length
    }
        
    // Compute the castScore (avg of cast scores) - this can be done in a less silly way
    var sums = []
    for(var i=0; i < mainCast.length; i++) { sums.push(mainCast[i]['score']) }
    const castScore = sums.reduce((a, b) => a + b) / mainCast.length
    //console.log(castScore)
            
    //console.log(id)
    //console.log(keywords)
    //console.log(genres)
    
    d.sessionId = appRequest.sessionID
    d.movies.push({'id': id,
            'title': title,
            'originalTitle': originalTitle,
            'originalLanguage': originalLanguage,
            'overview': overview,
            'mainCast': mainCast,
            'config': configBody,
            'score': score,
            'numVotes': numVotes,
            'castScore': castScore,
            'revenue': revenue,
            'budget': budget,
            'releaseDate': releaseDate
           })
    
    // Get movies by discovery ??
    
    return d;
  } catch (error) {
    console.log(error);
  }
};

app.post("/movie", (appRequest, appResponse) => {
  
  console.log('Inside the movie function')
  console.log(appRequest.sessionID)
  
  // Config endpoint to get base URL for images
  const configURL = 'https://api.themoviedb.org/3/configuration?api_key=' + apiKey
  // Search endpoint to get movie based on query
  const searchURL = 'https://api.themoviedb.org/3/search/movie?api_key=' + apiKey + 
                    '&language=en-US' + '&query=' + appRequest.query.movie

  AsyncFetch(configURL)
    .then(configBody => multiFetchAsync(appRequest, configBody, searchURL)
         .then(data => appResponse.send(data)));
  })
 

// App listener
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})
