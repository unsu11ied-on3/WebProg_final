require('./models/news.model.js');
require('./models/user.model.js');
const express = require("express")
const app = express();
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const publicIp = require('public-ip');
const mongoose = require("mongoose");
const User = mongoose.model('User');
const Article = mongoose.model('Article');
var emailValidator = require('email-validator');
const geoip = require('geoip-lite');
var passwordValidator = require('password-validator');
var schema = new passwordValidator();
schema
  .is().min(8)
  .is().max(32)
  .has().uppercase()
  .has().lowercase()
  .has().digits(1)
  .has().not().spaces()

var $ = require('jquery');

mongoose.connect('mongodb+srv://Adilzhan:Dusembay@cluster0.zmemn.mongodb.net/news?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}, function(err) {
  if (err) console.log(err);
  else console.log("Successfully connected to database...")
});

app.use(bodyParser.urlencoded({
  extended: true
}))

app.use('/public', express.static('public'))
app.set("view engine", "ejs")
app.locals.user = {};

function insertRecord(req, res) {
  var article = new Article({
    title: req.body.title,
    publishedAt: new Date().toString(),
    description: req.body.description,
    authorId: app.locals.user._id,
    authorName: `${app.locals.user.name} ${app.locals.user.surname}`
  });

  article.save(async (err, doc) => {
    if (err) {
      console.log("Error while adding new article: " + err)
      res.redirect('/news_form');
    } else {
      console.log("Successfully added new article to database!");
      res.redirect('/');
    }
  });
}

async function getWeather() {
  try {
    let ip = await publicIp.v4();
    let geo = geoip.lookup(ip)
    let weatherUrl = `http://api.openweathermap.org/data/2.5/weather?q=${geo.city}&appid=47a5960d44895cf4e6e459affe54cbaa&units=metric`
    const weatherResponse = await fetch(weatherUrl)
    const weatherData = await weatherResponse.json()
    return weatherData;
  } catch (e) {
    return e;
  }
}

async function getNews(category) {
  try {
    let newsUrl = `https://newsapi.org/v2/everything?q=${category}&sortBy=popularity&apiKey=9c1066dc880c474880ba754995905003`
    const newsResponse = await fetch(newsUrl)
    const newsData = await newsResponse.json()
    return newsData.articles;
  } catch (e) {
    return e;
  }
}

app.get("/sign_up", function(req, res) {
  res.render("sign_up", {
    error: ''
  })
})
app.get("/sign_in", function(req, res) {
  res.render("sign_in", {
    error: ''
  })
})

app.post("/sign_in", (req, res) => {
  console.log(req.body);
  User.findOne({
    email: req.body.email
  }, async (err, doc) => {
    console.log(doc);
    if (err) {
      console.log("Error while adding to database: " + err)
      return res.render('sign_in', {
        error: err
      });
    }
    if (!doc) {
      return res.render('sign_in', {
        error: 'User does not exist!'
      })
    }
    if (doc.password !== req.body.psw) {
      return res.render('sign_in', {
        error: 'Incorrect password!'
      });
    }
    app.locals.user = doc;
    res.redirect('/');
  });
})
app.get("/news_form/:id", function(req, res) {
  res.render("news_form", {
    update: true,
    articleId: req.params.id
  });
});


app.post("/sign_up", (req, res) => {
  console.log(req.body);

  if (!schema.validate(req.body.psw)) {
    return res.render('sign_up', {
      error: 'Password must contain at least 8 letters, upper and lowercase, 1 digit'
    });
  }

  if (!emailValidator.validate(req.body.email)) {
    return res.render('sign_up', {
      error: 'Email is not correct'
    });
  }

  let user = new User({
    email: req.body.email,
    name: req.body.name,
    surname: req.body.surname,
    password: req.body.psw
  });

  user.save(async (err, doc) => {
    if (err) {
      console.log("Error while adding to database: " + err)
      res.redirect('/');
    } else {
      console.log("Successfully added new user to database!");
      app.locals.user = doc;
      res.redirect('/');
    }
  });
})
app.post('/update/:id', (req, res) => {
  Article.findOneAndUpdate({
    _id: req.params.id
  }, req.body, {
    new: true
  }, (err, doc) => {
    if (err) {
      console.log("Error while updating article with ID " + req.params.id);
    } else {
      console.log("Successfully updated article");
    }
    res.redirect('/');
  });
});

app.get("/news_form/:id", function(req, res) {
  const id = req.params.id

  Article.findOne({
    _id: id
  }, function(err, foundNews) {
    if (!err) {
      if (foundNews) {
        const news = foundNews
        res.render("news_form", {
          news: news
        })
      }
    }
  })
})

app.get("/news_form", function(req, res) {
  res.render("news_form", {
    update: false
  });
})

app.post('/', (req, res) => {
  insertRecord(req, res);
});

app.post('/delete/:id', (req, res) => {
  Article.findByIdAndRemove(req.params.id, (err, doc) => {
    if (err) {
      console.log("Error while deleting article: " + err);
    } else {
      console.log("Successfully deleted article with ID " + req.params.id);
    }
    res.redirect('/');
  });
});

app.get("/logout", function(req, res) {
  console.log('Logging out...');
  console.log(app.locals.user);
  app.locals.user = {};
  res.redirect('/');
})

app.get("/:category", async function(req, res) {
  try {

    let weatherData = await getWeather();
    let newsData = await getNews(req.params.category);
    var weatherIcon = "http://openweathermap.org/img/wn/" + weatherData.weather[0].icon + "@2x.png";
    res.render("to-do", {
      news: newsData,
      weather: weatherData,
      weatherIcon: weatherIcon,
      user: app.locals.user
    });
  } catch (e) {
    res.send(e)
  }
})

app.get("/", async function(req, res) {
  try {
    Article.find({}).sort({
      publishedAt: 'desc'
    }).exec(async (err, docs) => {
      if (err) {
        console.log("Error while getting articles from database: " + err);
      } else {
        console.log("Successfully retrieved articles from database!");
        let weatherData = await getWeather();
        let newsData = await getNews("world");
        var weatherIcon = "http://openweathermap.org/img/wn/" + weatherData.weather[0].icon + "@2x.png";
        res.render("to-do", {
          news: [...docs, ...newsData],
          weather: weatherData,
          weatherIcon: weatherIcon,
          user: app.locals.user
        });
      }
    })
  } catch (e) {
    res.send(e)
  }
})

app.listen(5000, function() {
  console.log("localhost:5000")
})
