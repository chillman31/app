const express = require('express')
const morgan = require('morgan')
const app = express()
const bodyParser = require('body-parser')

app
    .use(bodyParser.json())
    .use(morgan('dev'))

require('./routes/login')(app)
require('./routes/loadRoutes')(app)



app.listen(4000, () => console.log('Connexion au serveur établie.'))



