// server.js

const express = require('express');
const cors = require('cors');
const axios = require('axios'); 

const app = express();
const PORT = 3001;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Endpoint to receive data and forward to Webhook.site
app.post('/send-webhook', async (req, res) => {
    const webhookUrl = 'https://webhook.site/22bf8b7a-22eb-44bf-9b8c-119cd3abbfb0'; // Replace with your Webhook.site URL

    try {
        // Forward request to Webhook.site
        const response = await axios.post(webhookUrl, req.body, {
            headers:{
                'Content-Type': 'application/json',
            },
        
        });

        res.status(200).json({
            message: 'Data sent to webhook successfully',
            data: response.data,
        });
    } catch (error) {
        console.error('Error sending data to webhook:', error);
        res.status(500).json({
            message: 'Failed to send data to webhook',
            error: error.message,
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Node server is running on http://localhost:${PORT}`);
});
