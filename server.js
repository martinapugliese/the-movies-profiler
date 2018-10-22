// Imports
const express = require('express');
const uuid = require('uuid/v4')
var session = require('express-session');
const fetch = require('node-fetch');
var d3 = require("d3");

// Global vars
const apiKey = process.env.MOVIEDB_API_KEY;   // the API key to TMDB API
var moviesData = {}                           // global object with session and movies info
moviesData.ids = []
moviesData.scores = []
moviesData.recencies = []
moviesData.castScores = []
moviesData.genres = {}
moviesData.keywords = {}
moviesData.financialSuccesses = []
moviesData.originalLanguages = {}

// Initialise express app
const app = express();
app.use(express.static('public'))

// Session configuration
app.use(session({
  genid: (req) => {
    return uuid()
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}))

app.get("/", (appRequest, appResponse) => {
  appResponse.sendFile(__dirname + '/views/index.html')
})

const AsyncFetch = async url => {
  let response = await (await fetch(url)).json();
  return response;
}

const multiFetchAsync = async (appRequest, configBody, searchURL) => {
  try {
    
    var response = await (await fetch(searchURL)).json();
    const id = response.results[0].id
    moviesData.ids.push(id)
    
    // Movie details endpoint - ping and fetch data
    const movieURL = 'https://api.themoviedb.org/3/movie/' + id + '?api_key=' + apiKey + '&language=en-US' + 
                     '&append_to_response=keywords,recommendations,credits,images'
    var response = await (await fetch(movieURL)).json();
    
    // Title and overview data
    const overview = response.overview
    const title = response.title
    const originalTitle = response.original_title
    
    // Update the language data counts
    moviesData.originalLanguages[response.original_language] = 
      moviesData.originalLanguages[response.original_language] ?
      moviesData.originalLanguages[response.original_language] += 1 : 1
    
    // Financial success - fraction revenue to budget, rounded
    moviesData.financialSuccesses.push(Number((response.revenue/response.budget).toFixed(2)))
    
    // Score users gave
    const score = response.vote_average
    const numVotes = response.vote_count
    moviesData.scores.push(score)
        
    // Update the counts for genres and keywords
    const genres = response.genres
    for (var i=0; i < genres.length; i++) {
      moviesData.genres[genres[i].name] = 
        moviesData.genres[genres[i].name] ? moviesData.genres[genres[i].name] += 1 : 1
    }
    const keywords = response.keywords.keywords
    for (var i=0; i < keywords.length; i++) {
      moviesData.keywords[keywords[i].name] = 
        moviesData.keywords[keywords[i].name] ? moviesData.keywords[keywords[i].name] += 1 : 1
    }
    
    // Compute how old is the movie in years
    const yearsBack = new Date().getFullYear() - new Date(response.release_date).getFullYear()
    moviesData.recencies.push(yearsBack)
    
    // Recommended movies
    const recommendations = response.recommendations
    
    // Images
    const images = response.images
    
    // Fetch data against the main cast (first 5 in order of insertion)
    var mainCast = response.credits.cast.filter((item => item.order <= 5))
    for (var i=0; i < mainCast.length; i++) {
      
      // Person endpoint - ping
      var personURL = 'https://api.themoviedb.org/3/person/' + mainCast[i].id + '?api_key=' + apiKey + 
                      '&language=en-US&append_to_response=movie_credits'
      var response = await (await fetch(personURL)).json();
      var personScores = []
      for (var j=0; j < response.movie_credits.cast.length; j++) {
        personScores.push(response.movie_credits.cast[j].vote_average)
      }
      mainCast[i]['score'] = personScores.reduce((a, b) => a + b) / personScores.length
    }
        
    // Compute the castScore (avg of cast scores) and update - rounded
    var sums = []
    for(var i=0; i < mainCast.length; i++) { sums.push(mainCast[i]['score']) }
    const castScore = sums.reduce((a, b) => a + b) / mainCast.length
    moviesData.castScores.push(Number(castScore.toFixed(2)))
    
    moviesData.sessionId = appRequest.sessionID
        
    return moviesData;
  } catch (error) {
    console.log(error);
  }
};

app.post("/movie", (appRequest, appResponse) => {
    
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
