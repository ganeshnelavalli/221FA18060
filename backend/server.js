const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const urlDatabase = {};
const baseUrl = 'http://localhost:3000/';

const EXPIRY_MINUTES = 30;

function generateShortId(length = 5) {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

app.post('/shorten', (req, res) => {
	const { longUrl } = req.body;
	if (!longUrl || !longUrl.startsWith('http')) {                                                           
		return res.status(400).json({ error: 'Invalid URL' });
	}
	for (const [shortId, data] of Object.entries(urlDatabase)) {
		if (data.longUrl === longUrl && (!data.expiresAt || data.expiresAt > Date.now())) {
			return res.json({ shortUrl: baseUrl + shortId, expiresAt: data.expiresAt, accessCount: data.accessCount || 0 });
		}
	}
	const shortId = generateShortId();
	const expiresAt = Date.now() + EXPIRY_MINUTES * 60 * 1000;
	urlDatabase[shortId] = { longUrl, expiresAt, accessCount: 0 };
	res.json({ shortUrl: baseUrl + shortId, expiresAt, accessCount: 0 });
});

app.get('/:shortId', (req, res) => {
	const { shortId } = req.params;
	const data = urlDatabase[shortId];
	if (data && (!data.expiresAt || data.expiresAt > Date.now())) {
		data.accessCount = (data.accessCount || 0) + 1;
		return res.redirect(data.longUrl);
	} else {
		return res.status(404).send('URL not found or expired');
	}
});

app.get('/stats/:shortId', (req, res) => {
	const { shortId } = req.params;
	const data = urlDatabase[shortId];
	if (data) {
		res.json({
			longUrl: data.longUrl,
			expiresAt: data.expiresAt,
			accessCount: data.accessCount || 0
		});
	} else {
		res.status(404).json({ error: 'Short URL not found' });
	}
});

app.listen(PORT, () => {
	console.log(`URL Shortener backend running on http://localhost:${PORT}`);
});
