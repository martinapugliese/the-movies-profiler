$(function() {  
  
    $('form').submit(function(event) {
    event.preventDefault()
    var movie = $('input').val()
    $.post('/movie?' + $.param({movie: movie}), function(data) {
      
      console.log(data);
      
      // $("#p1").css("Font-Weight","Bold").text("Here's the movie:")
      // $("#movie-title").text("Title " + data.movies.slice(-1)[0].title)
      // $("#movie-genres").text("Title " + data.movies.slice(-1)[0].genres)
      // $("#movie-keywords").text("Title " + data.movies.slice(-1)[0].keywords)
      // $("#movie-original-language").text("Original language " + data.movies.slice(-1)[0].originalLanguage)
      // $("#movie-score").text("Score " + data.movies.slice(-1)[0].score)
      // $("#movie-cast-score").text("Cast score: " + data.movies.slice(-1)[0].castScore)
      // $("#movie-money").text("Finance fraction: " + data.movies.slice(-1)[0].financeFraction)
      
      //$("#img").attr("src", data.config.images.secure_base_url + 'w500/' + data.credits.cast[0].profile_path)
      
    })
  })
})
