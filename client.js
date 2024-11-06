import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBzY2xRHDcIouYixSU7Yo7R0A-MC0P2beo",
    authDomain: "sia101-activity2-teamgen-8a6a6.firebaseapp.com",
    projectId: "sia101-activity2-teamgen-8a6a6",
    storageBucket: "sia101-activity2-teamgen-8a6a6.appspot.com",
    messagingSenderId: "803086391758",
    appId: "1:803086391758:web:50989a4b4ed9d60796b39f",
    measurementId: "G-SS9PWT6RJ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Variable to track the logged-in user
let loggedInUserEmail = null;

// Detect authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Only send the webhook notification if the logged in user is different
        if (loggedInUserEmail !== user.email) {
            loggedInUserEmail = user.email; // Update the logged-in user email
            sendWebhookNotification('User Logged In', { email: user.email }); // Send webhook notification on login
            addNotification(`User logged in: ${user.email}`); // Add notification to the bell
        }
    } else {
        loggedInUserEmail = null; // Reset when user logs out
    }
});

// Sign-up form event listener
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    registerUser(email, password);
});


// User registration
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        alert('Registration successful!');
        document.getElementById('signupForm').style.display = 'none'; // Hide signup
        document.getElementById('loginForm').style.display = 'block'; // Show login
    } catch (error) {
        console.error('Error registering user:', error);
    }
}


// Login form event listener
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const userCredentials = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredentials.user;
        alert('Sign In Successful!');

        // Hide the login form and show modal
        document.getElementById('loginForm').style.display = 'none';
        showModal();

        // The webhook is sent from onAuthStateChanged now
    } catch (error) {
        alert(error.message);
    }
});

// Search function using Nominatim API
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    if (query) {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1`;

        fetch(nominatimUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.length > 0) {
                    const { lat, lon, display_name } = data[0];

                    // Clear previous markers
                    map.eachLayer(layer => {
                        if (layer instanceof L.Marker) {
                            map.removeLayer(layer);
                        }
                    });

                    // Set view to the new location
                    map.setView([lat, lon], 13);
                    L.marker([lat, lon]).addTo(map).bindPopup(display_name).openPopup();

                    // Send webhook notification for location search including the logged-in user
                    if (loggedInUserEmail) {
                        sendWebhookNotification('Location search: ' + display_name, { user: loggedInUserEmail });
                    }
                    addNotification(`Location searched: ${display_name}`);
                } else {
                    alert('Location not found');
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alert('Failed to fetch data: ' + error.message);
            });

        // Clear search input after adding notification
        document.getElementById('search-input').value = '';  
    } else {
        alert('Please enter a location');
    }
});

// Show modal function
function showModal() {
    document.getElementById('mapModal').style.display = 'block';
    initializeMap();
}

// Initialize Leaflet Map
let map;

function initializeMap() {
    map = L.map('map').setView([51.505, -0.09], 13); // Default view
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 25,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

// Toggle between sign-in and sign-up forms
document.getElementById('showSignup').onclick = function() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
};

document.getElementById('showSignin').onclick = function() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
};

// Function to send a POST request to the webhook URL
function sendWebhookNotification(action, additionalData) {
    const nodeserverURL = 'http://localhost:3001/send-webhook';
    const payload = {
        action: action,
        timestamp: new Date().toISOString(),
        ...additionalData,
    };
    console.log('Sending webhook notification: ', payload);
    fetch(nodeserverURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => {
        if (response.ok) {
            console.log(`Notification sent successfully!`);
        } else {
            console.error(`Failed to send notification:`, response.statusText);
        }
    })
    .catch(error => {
        console.error(`Error sending notification:`, error);
    });
}

// Notification management functions
function addNotification(message) {
    const notificationList = document.getElementById("notification-list");
    const notificationItem = document.createElement("li");
    notificationItem.textContent = message;
    notificationList.appendChild(notificationItem);
    incrementNotificationBadge();
}

function incrementNotificationBadge() {
    const badge = document.getElementById("notification-badge");
    let count = parseInt(badge.textContent) || 0;
    count++;
    badge.textContent = count;
    badge.style.display = "inline";
}

// Show notifications on bell click
document.getElementById('notify-bell').addEventListener('click', function () {
    const notificationsDiv = document.getElementById('notifications');
    const isVisible = notificationsDiv.style.visibility === 'visible';
    notificationsDiv.style.visibility = isVisible ? 'hidden' : 'visible';
    notificationsDiv.style.opacity = isVisible ? '0' : '1';

    if (!isVisible) {
        // Fetch past notifications if needed
        fetchPreviousNotifications();
    }
});

// Fetch existing notifications from the server (optional)
function fetchPreviousNotifications() {
    fetch('http://localhost:3001/get-notifications', {
        method: 'GET',
    })
    .then(response => response.json())
    .then(data => {
        const notificationList = document.getElementById('notification-list');
        notificationList.innerHTML = ""; // Clear previous items
        data.forEach(notification => {
            const notificationItem = document.createElement('li');
            notificationItem.textContent = `Action: ${notification.action}, Time: ${notification.timestamp}`;
            notificationList.appendChild(notificationItem);
        });
    })
    .catch(error => console.error('Error:', error));
}

// Initialize notification display
document.getElementById("notification-badge").style.display = "none";
