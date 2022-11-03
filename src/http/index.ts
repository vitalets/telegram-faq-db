import express from 'express';
import { TgClient } from '../index.js';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.all('/', async (req, res) => {
    const ip = req.headers['x-forwarded-for'];
    console.log(`${req.method} ${req.url} from ${ip}`);
    const client = new TgClient();

    try {
      console.log('logging in...');
      await client.login();
      console.log('logged in');
    } finally {
      await client.close();
    }

    return res.send('Hello!');
});

app.listen(process.env.PORT, () => {
    console.log(`App listening at port ${process.env.PORT}`);
});
