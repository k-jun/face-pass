const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const keys = require('./config/keys');
const cors = require('cors');

require('./models/User');


mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useNewUrlParser: true });

const app = express();


app.use(cors());
app.use(bodyParser.json());

require('./routes/userRoutes')(app);

if (['production'].includes(process.env.NODE_ENV)) {
    app.use(express.static('client/build'));

    const path = require('path');
    app.get('*', (req, res) => {
        res.sendFile(path.resolve('client', 'build', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Listening on port please`, PORT);
});
