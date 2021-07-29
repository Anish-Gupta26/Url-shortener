const express = require('express')
const app = express()
const shortId = require('shortid')
const mongoose = require('mongoose')
const createHttpError = require('http-errors')
const path = require('path')
const dotenv = require('dotenv')
const ShortUrl = require('./models/url.model')
const port = process.env.PORT || 80

//Setting up path
app.use(express.static(path.join(__dirname,'public')))
app.use(express.json())
app.use(express.urlencoded({ extended:false }))
app.set('view engine','ejs')

//Connecting with MongoDB Atlas
dotenv.config({path:'./config.env'});
const DB = process.env.DATABASE;
// const DB = 'mongodb://localhost:27017'  For MongoDB compass
mongoose.connect(DB,{ 
    dbName: 'url-shortner',
    useCreateIndex: true, 
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(()=>{
    console.log("DB connected")
}).catch((error)=>{
    console.log(error);
})

//Routing
  app.get('/',async(req,res,next)=>{
      res.render('index')
  })

  app.post('/', async (req, res, next) => {
    try {
      const { url } = req.body
      if (!url) {
        throw createHttpError.BadRequest('Provide a valid url')
      }
      const urlExists = await ShortUrl.findOne({ url })
      if (urlExists) {
        res.render('index', {
          short_url: `${req.headers.host}/${urlExists.shortId}`
        })
        return
      }
      const shortUrl = new ShortUrl({ url: url, shortId: shortId.generate() })
      const result = await shortUrl.save()
      res.render('index', {
        short_url: `${req.headers.host}/${result.shortId}`
      })
    } catch (error) {
      next(error)
    }
  })
  
  app.get('/:shortId', async (req, res, next) => {
    try {
      const { shortId } = req.params
      const result = await ShortUrl.findOne({ shortId })
      if (!result) {
        throw createHttpError.NotFound('Short url does not exist')
      }
      res.redirect(result.url)
    } catch (error) {
      next(error)
    }
  })

  app.use((req,res,next)=>{
      next(createHttpError.NotFound())
  })
 
  app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.render('index', { error: err.message })
  })


//SERVER
app.listen(port,()=>{
    console.log(`Server is running at ${port}`)
})


