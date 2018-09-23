// client-side js
// run by the browser each time your view template is loaded

$(function() {  
  
    $('form').submit(function(event) {
    event.preventDefault()
    var movie = $('input').val()
    $.post('/movie?' + $.param({movie: movie}), function(data) {
      
      console.log(data);
      
      $("#p1").css("Font-Weight","Bold").text("Here's the overview of the movie:")
      $("#movie-overview").text(data.movies.slice(-1)[0].overview)
      $("#movie-title").text("Title " + data.movies.slice(-1)[0].title)
      $("#movie-original-title").text("Original title " + data.movies.slice(-1)[0].originalTitle)
      $("#movie-original-language").text("Original language " + data.movies.slice(-1)[0].originalLanguage)
      $("#movie-score").text("Score " + data.movies.slice(-1)[0].score)
      $("#movie-cast-score").text("Cast score: " + data.movies.slice(-1)[0].castScore)
      $("#movie-money").text("Budget: " + data.movies.slice(-1)[0].budget + " Revenue: " + data.movies.slice(-1)[0].revenue)
      $("#movie-release-date").text("Release date: " + data.movies.slice(-1)[0].releaseDate)
      
      //$("#img").attr("src", data.config.images.secure_base_url + 'w500/' + data.credits.cast[0].profile_path)
      
    })
  })
  
})