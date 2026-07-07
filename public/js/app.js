import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Because <script type="module"> is deferred automatically by the browser, 
// the DOM is already loaded. We do not need DOMContentLoaded.

// --- 1. Menu Modal Logic ---
const menuModal = document.getElementById('menuModal');
const openMenuBtn = document.getElementById('openMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');

if (openMenuBtn && menuModal && closeMenuBtn) {
    openMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        menuModal.classList.remove('hidden');
        menuModal.classList.add('flex');
    });

    closeMenuBtn.addEventListener('click', () => {
        menuModal.classList.add('hidden');
        menuModal.classList.remove('flex');
    });
}

// --- 2. Dynamic CAPTCHA Logic ---
const captchaLabel = document.getElementById('captchaLabel');
const captchaInput = document.getElementById('captchaInput');
let expectedCaptchaAnswer = 0;

function generateCaptcha() {
    if (!captchaLabel || !captchaInput) {
        console.error("CAPTCHA elements not found in the DOM.");
        return;
    }
    
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    expectedCaptchaAnswer = num1 + num2;
    
    // Safely inject the math puzzle into the DOM
    captchaLabel.textContent = `Security Check: What is ${num1} + ${num2}?`;
    captchaInput.value = '';
}

// Initialize CAPTCHA immediately
generateCaptcha();

// --- 3. Booking Form Logic ---
const bookingForm = document.getElementById('bookingForm');
const successMessage = document.getElementById('successMessage');
const submitBtn = document.getElementById('submitBtn');

const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Verify CAPTCHA first
        const userAnswer = parseInt(captchaInput.value, 10);
        if (userAnswer !== expectedCaptchaAnswer) {
            alert("Incorrect security check answer. Please try again.");
            generateCaptcha(); 
            return; // Block form submission
        }

        // Disable button to prevent duplicate submissions
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Processing...';

        // Gather Form Data
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const guests = document.getElementById('guests').value;

        try {
            // Write to Firestore including the phone number
            await addDoc(collection(db, "bookings"), {
                name: name,
                email: email,
                phone: phone,
                date: date,
                time: time,
                guests: parseInt(guests),
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // Show Success UI
            bookingForm.reset();
            generateCaptcha(); 
            
            successMessage.classList.remove('hidden');
            successMessage.classList.add('flex');
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.add('hidden');
                successMessage.classList.remove('flex');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Request Booking';
            }, 5000);

        } catch (error) {
            console.error("Error adding document: ", error);
            alert("There was an error submitting your booking. Please try again.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Request Booking';
        }
    });
}
